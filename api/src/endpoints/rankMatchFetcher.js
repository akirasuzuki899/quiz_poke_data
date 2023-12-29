async function getRequest(url) {
  const headers = {
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'CountryCode': '304',
    'LangCode': '1',
    'Content-Type': 'application/json'
  };

  try {
    const response = await fetch(url, { method: 'GET', headers });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  } catch (error) {
    console.error(`GET request failed: ${error}`);
    return null;
  }
}

async function postRequest(url, body) {
  const headers = {
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'CountryCode': '304',
    'LangCode': '1',
    'Content-Type': 'application/json'
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
  } catch (error) {
    console.error(`POST request failed: ${error}`);
    return null;
  }
}

export async function fetchRankMatchInfo() {
  const url = 'https://api.battle.pokemon-home.com/tt/cbd/competition/rankmatch/list';
  const body = { "soft": "Sc" };
  return await postRequest(url, body);
}

// 最新シーズンのダブルバトルのポケモン使用率ランキングを取得
export async function fetchLatestDoubleBattlePokemonRanking() {
  const rankMatchInfo = await fetchRankMatchInfo();
  if (!rankMatchInfo || !rankMatchInfo.list) return null;

  // 最新シーズンの特定
  const latestSeason = Math.max(...Object.keys(rankMatchInfo.list).map(Number));
  const latestSeasonData = rankMatchInfo.list[latestSeason.toString()];

  // ダブルバトルデータの取得
  const doubleBattleEntries = Object.values(latestSeasonData);
  const doubleBattleData = doubleBattleEntries.find(data => data.rule === 1);
  if (!doubleBattleData) return null;

  return await pokemonRanking(doubleBattleData.cId, doubleBattleData.rst, doubleBattleData.ts2);
}


// 対象シーズンのポケモン使用率ランキングを取得
async function pokemonRanking(id, rst, ts2) {
  const url = `https://resource.pokemon-home.com/battledata/ranking/scvi/${id}/${rst}/${ts2}/pokemon`;
  return await getRequest(url);
}

// 最新シーズンのダブルバトルのポケモンデータを取得
export async function fetchLatestDoubleBattleData() {
  const rankMatchInfo = await fetchRankMatchInfo();
  if (!rankMatchInfo || !rankMatchInfo.list) return null;

  // 最新シーズンの特定
  const latestSeason = Math.max(...Object.keys(rankMatchInfo.list).map(Number));
  const latestSeasonData = rankMatchInfo.list[latestSeason.toString()];

  // ダブルバトルデータの取得
  const doubleBattleEntries = Object.values(latestSeasonData);
  const doubleBattleData = doubleBattleEntries.find(data => data.rule === 1);
  if (!doubleBattleData) return null;

  return await pokemonBattleData(doubleBattleData.cId, doubleBattleData.rst, doubleBattleData.ts2);
}


// 対象シーズンのバトルのポケモンデータを取得
async function pokemonBattleData(id, rst, ts2) {
  let mergedData = {};

  for (let i = 0; i < 5; i++) {
    const url = `https://resource.pokemon-home.com/battledata/ranking/scvi/${id}/${rst}/${ts2}/pdetail-${i + 1}`;
    const data = await getRequest(url);
    
    if (data) {
      mergedData = { ...mergedData, ...data };
    }
  }

  return mergedData;
}