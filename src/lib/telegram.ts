// Mini App deep links: t.me/<bot>/<app>?startapp=ds_<datasetId> opens that dataset.
export const DATASET_START_PARAM = /^ds_([A-Za-z0-9_-]{1,60})$/;

export function datasetStartParam(datasetId: string) {
  return `ds_${datasetId}`;
}

export function botUrl(username: string | undefined, startParam?: string) {
  if (!username) return null;
  const url = new URL(`https://t.me/${username.replace(/^@/, '')}`);
  if (startParam) url.searchParams.set('start', startParam);
  return url.toString();
}
