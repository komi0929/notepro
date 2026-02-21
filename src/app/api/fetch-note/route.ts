import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || !url.includes("note.com")) {
      return NextResponse.json(
        { error: "Invalid note.com URL" },
        { status: 400 },
      );
    }

    // note.comのページをフェッチしてOGPメタデータを取得
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "ja,en;q=0.9",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch: ${response.status}` },
        { status: 502 },
      );
    }

    const html = await response.text();

    // OGPタグからメタデータ抽出
    const getMetaContent = (property: string): string | null => {
      // og:property or name=property
      const ogMatch = html.match(
        new RegExp(
          `<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*)["']`,
          "i",
        ),
      );
      if (ogMatch) return ogMatch[1];

      const nameMatch = html.match(
        new RegExp(
          `<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']*)["']`,
          "i",
        ),
      );
      if (nameMatch) return nameMatch[1];

      // content before property (some sites order differently)
      const reverseMatch = html.match(
        new RegExp(
          `<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${property}["']`,
          "i",
        ),
      );
      if (reverseMatch) return reverseMatch[1];

      return null;
    };

    // タイトル取得
    const ogTitle = getMetaContent("og:title");
    const htmlTitleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title =
      ogTitle || (htmlTitleMatch ? htmlTitleMatch[1].trim() : "タイトル不明");

    // 説明文
    const excerpt =
      getMetaContent("og:description") || getMetaContent("description") || null;

    // カバー画像
    const coverImageUrl = getMetaContent("og:image") || null;

    // 著者名をページから抽出（note.comの構造に合わせる）
    // note.comはJSONLD or noteのデータ構造からクリエイター情報を取得
    let creatorNickname: string | null = null;
    let creatorUrlname: string | null = null;
    let creatorProfileImage: string | null = null;

    // URL からurlnameを取得
    const urlMatch = url.match(/note\.com\/([^/]+)\/n\//);
    if (urlMatch) {
      creatorUrlname = urlMatch[1];
    }

    // JSON-LDからauthor情報を取得
    const jsonLdMatch = html.match(
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i,
    );
    if (jsonLdMatch) {
      try {
        const jsonLd = JSON.parse(jsonLdMatch[1]);
        if (jsonLd.author) {
          creatorNickname = jsonLd.author.name || null;
          if (jsonLd.author.image) {
            creatorProfileImage =
              jsonLd.author.image.url || jsonLd.author.image || null;
          }
        }
        // publishedDateも取得
        if (jsonLd.datePublished) {
          // 後で使える
        }
      } catch {
        // JSON-LDパース失敗 — 無視
      }
    }

    // note.comの__NEXT_DATA__からも探す
    const nextDataMatch = html.match(
      /<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i,
    );
    if (nextDataMatch) {
      try {
        const nextData = JSON.parse(nextDataMatch[1]);
        const note =
          nextData?.props?.pageProps?.note ||
          nextData?.props?.pageProps?.noteBody;
        if (note) {
          if (note.user) {
            creatorNickname = creatorNickname || note.user.nickname || null;
            creatorUrlname = creatorUrlname || note.user.urlname || null;
            creatorProfileImage =
              creatorProfileImage || note.user.userProfileImagePath || null;
          }
        }
      } catch {
        // __NEXT_DATA__パース失敗 — 無視
      }
    }

    // note:creator メタタグ
    if (!creatorNickname) {
      const noteCreator = getMetaContent("note:creator");
      if (noteCreator) creatorNickname = noteCreator;
    }

    // twitter:creator
    if (!creatorNickname) {
      const twitterCreator = getMetaContent("twitter:creator");
      if (twitterCreator) creatorNickname = twitterCreator;
    }

    // og:site_name的なものからfallback
    if (!creatorNickname && creatorUrlname) {
      creatorNickname = creatorUrlname;
    }

    // ハッシュタグ抽出（note.comのタグ）
    const hashtags: string[] = [];
    const tagRegex = /note\.com\/hashtag\/([^"'?&#\s]+)/g;
    let tagExec;
    while ((tagExec = tagRegex.exec(html)) !== null) {
      const tag = decodeURIComponent(tagExec[1]);
      if (!hashtags.includes(tag)) {
        hashtags.push(tag);
      }
    }

    // 有料記事かどうか
    const isPaid =
      html.includes('"is_limited":true') ||
      html.includes("有料") ||
      html.includes("note-premium");

    // 文字数推定（本文テキスト抽出は困難なのでタイトル+excerptから推定）
    const estimatedWordCount = excerpt ? Math.round(excerpt.length * 8) : 1000;
    const estimatedReadingTime = Math.max(
      1,
      Math.round(estimatedWordCount / 500),
    );

    return NextResponse.json({
      title,
      excerpt,
      coverImageUrl,
      creatorNickname: creatorNickname || creatorUrlname || "不明",
      creatorUrlname: creatorUrlname || "unknown",
      creatorProfileImage,
      hashtags: hashtags.slice(0, 10),
      isPaid,
      wordCount: estimatedWordCount,
      readingTime: estimatedReadingTime,
    });
  } catch (error) {
    console.error("fetch-note error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "メタデータ取得に失敗しました",
      },
      { status: 500 },
    );
  }
}
