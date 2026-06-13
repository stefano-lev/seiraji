export function extractHostNames(
  footerItems: Array<{ menu_item_header?: string }> = []
): string[] {
  const hosts = footerItems
    .map((item) => item.menu_item_header ?? '')
    .filter(
      (text) =>
        text.includes('Xアカウント') || text.includes('Instagramアカウント')
    )
    .map((text) =>
      text
        .replace(/【.*?アカウント】/g, '')
        .replace(/\s+/g, '')
        .trim()
    )
    .filter(Boolean);

  return [...new Set(hosts)];
}
