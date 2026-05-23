/**
 * generate-pdfs.js
 * Puppeteer で各 HTM ページを A4 PDF に変換して reference/pdf/ に保存する。
 * GitHub Actions または ローカルで実行。
 *
 * 前提: npx serve reference -p 8080 でローカルサーバーが起動済みであること。
 */

const puppeteer = require('puppeteer');
const fs        = require('fs');
const path      = require('path');

const BASE_URL = 'http://localhost:8080';
const PDF_DIR  = path.join(__dirname, '../reference/pdf');

// ── 変換対象ページ一覧 ─────────────────────────────────────────────────────
// src  : ローカルサーバーからの URL パス（日本語ファイル名はそのまま記述）
// out  : PDF の出力先（PDF_DIR からの相対パス）
const PAGES = [
  // 審議対象資料
  { src: '/siryoh/shingi/事業フロー.htm',                                out: 'shingi/事業フロー.pdf' },
  { src: '/siryoh/shingi/ブランドマネジメントシート.htm',                 out: 'shingi/ブランドマネジメントシート.pdf' },
  { src: '/siryoh/shingi/KAGA_JC_GATHERING_QUEST_手段選定理由書.htm',    out: 'shingi/KAGA_JC_GATHERING_QUEST_手段選定理由書.pdf' },
  { src: '/siryoh/shingi/KAGA_JC_GATHERING_仕様書.htm',                  out: 'shingi/KAGA_JC_GATHERING_仕様書.pdf' },
  { src: '/siryoh/shingi/ふりかえりシート.htm',                           out: 'shingi/ふりかえりシート.pdf' },
  { src: '/siryoh/shingi/カード一覧.htm',                                out: 'shingi/カード一覧.pdf' },
  { src: '/siryoh/shingi/グループ編成計画.htm',                           out: 'shingi/グループ編成計画.pdf' },
  { src: '/siryoh/shingi/ゲーム進行マニュアル.htm',                       out: 'shingi/ゲーム進行マニュアル.pdf' },
  { src: '/siryoh/shingi/予算項目の取扱いに関するメモ.htm',               out: 'shingi/予算項目の取扱いに関するメモ.pdf' },
  { src: '/siryoh/shingi/会場選定理由書.htm',                            out: 'shingi/会場選定理由書.pdf' },
  { src: '/siryoh/shingi/個人情報・プライバシー配慮に関する運営ルール.htm', out: 'shingi/個人情報・プライバシー配慮に関する運営ルール.pdf' },
  { src: '/siryoh/shingi/加賀JCメンバーへの周知文.htm',                  out: 'shingi/加賀JCメンバーへの周知文.pdf' },
  { src: '/siryoh/shingi/当日実施要項.htm',                              out: 'shingi/当日実施要項.pdf' },
  { src: '/siryoh/shingi/当日役割分担表.htm',                            out: 'shingi/当日役割分担表.pdf' },
  // 参考資料
  { src: '/siryoh/sankoh/JCプログラム公式資料.htm',                      out: 'sankoh/JCプログラム公式資料.pdf' },
  { src: '/siryoh/sankoh/ビジネスゲーム導入事例.htm',                    out: 'sankoh/ビジネスゲーム導入事例.pdf' },
  { src: '/siryoh/sankoh/ペルソナ.htm',                                  out: 'sankoh/ペルソナ.pdf' },
  { src: '/siryoh/sankoh/テーブルゲームマスター進行台本.htm',              out: 'sankoh/テーブルゲームマスター進行台本.pdf' },
  { src: '/siryoh/sankoh/ハードルカード一覧.htm',                         out: 'sankoh/ハードルカード一覧.pdf' },
  { src: '/siryoh/sankoh/ミッションカード一覧.htm',                        out: 'sankoh/ミッションカード一覧.pdf' },
  { src: '/siryoh/sankoh/コンプライアンスチェックシート.htm',              out: 'sankoh/コンプライアンスチェックシート.pdf' },
  { src: '/siryoh/sankoh/コンプライアンス受付表.htm',                    out: 'sankoh/コンプライアンス受付表.pdf' },
  { src: '/siryoh/sankoh/加賀JC2026年度_理事長所信.htm',                out: 'sankoh/加賀JC2026年度_理事長所信.pdf' },
  { src: '/siryoh/sankoh/加賀JC出席状況確認資料.htm',                    out: 'sankoh/加賀JC出席状況確認資料.pdf' },
  { src: '/siryoh/sankoh/公開議案_他LOM事例調査資料.htm',                out: 'sankoh/公開議案_他LOM事例調査資料.pdf' },
  { src: '/siryoh/sankoh/正副メンター役割確認シート.htm',                  out: 'sankoh/正副メンター役割確認シート.pdf' },
  { src: '/siryoh/sankoh/役割傾向チェック設計資料.htm',                   out: 'sankoh/役割傾向チェック設計資料.pdf' },
  // 想定問答集（reference/ 直下）
  { src: '/想定問答集.htm',                                              out: '想定問答集.pdf' },
];

// ── メイン処理 ─────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n📄 PDF生成開始 — ${PAGES.length} ページ\n`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  let ok = 0, ng = 0;

  for (const { src, out } of PAGES) {
    const outPath = path.join(PDF_DIR, out);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });

    try {
      const page = await browser.newPage();

      // 日本語ファイル名を encodeURI して安全にアクセス
      await page.goto(BASE_URL + encodeURI(src), {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      // フォント描画が完了するまで少し待機
      await new Promise(r => setTimeout(r, 500));

      await page.pdf({
        path: outPath,
        format: 'A4',
        printBackground: true,
        margin: { top: '15mm', bottom: '15mm', left: '12mm', right: '12mm' }
        // @media print の CSS が自動適用され .nav/.pdf-btn 等は非表示になる
      });

      await page.close();
      console.log(`  ✓ ${out}`);
      ok++;
    } catch (err) {
      console.error(`  ✗ ${out} — ${err.message}`);
      ng++;
    }
  }

  await browser.close();

  console.log(`\n完了: ${ok} 件成功 / ${ng} 件失敗\n`);
  if (ng > 0) process.exit(1);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
