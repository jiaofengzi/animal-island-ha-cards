// 卡片说明文档仍指向上游 Mushroom 5.2.3（字段与其一致）。
const repository = { url: "https://github.com/piitaya/lovelace-mushroom" };

interface RegisterBadgeParams {
  type: string;
  name: string;
  description: string;
}
export function registerCustomBadge(params: RegisterBadgeParams) {
  const windowWithBadges = window as unknown as Window & {
    customBadges: unknown[];
  };
  windowWithBadges.customBadges = windowWithBadges.customBadges || [];

  const badgePage = params.type.replace("-badge", "").replace("island-", "");
  windowWithBadges.customBadges.push({
    ...params,
    preview: true,
    documentationURL: `${repository.url}/blob/v5.2.3/docs/badges/${badgePage}.md`,
  });
}
