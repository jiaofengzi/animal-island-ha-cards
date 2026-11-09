// 卡片说明文档仍指向上游 Mushroom 5.2.3（字段与其一致）。
const repository = { url: "https://github.com/piitaya/lovelace-mushroom" };

interface RegisterCardParams {
  type: string;
  name: string;
  description: string;
}
export function registerCustomCard(params: RegisterCardParams) {
  const windowWithCards = window as unknown as Window & {
    customCards: unknown[];
  };
  windowWithCards.customCards = windowWithCards.customCards || [];

  const cardPage = params.type.replace("-card", "").replace("island-", "");
  windowWithCards.customCards.push({
    ...params,
    preview: true,
    documentationURL: `${repository.url}/blob/v5.2.3/docs/cards/${cardPage}.md`,
  });
}
