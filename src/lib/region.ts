export const region = {
  locale: "es-AR",
  currency: "ARS",
  timeZone: "America/Argentina/Mendoza",
} as const;
export const formatMoney = (amount: number) =>
  new Intl.NumberFormat(region.locale, {
    style: "currency",
    currency: region.currency,
  }).format(amount);
