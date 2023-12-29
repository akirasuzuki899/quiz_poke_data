import { OpenAPIRoute, OpenAPIRouteSchema, Query } from "@cloudflare/itty-router-openapi";
import { fetchLatestDoubleBattlePokemonRanking } from './rankMatchFetcher';

export interface Env {
  POKEMON_DATA: KVNamespace;
}

export class PokeData extends OpenAPIRoute {
  static schema: OpenAPIRouteSchema = {
    tags: ["Pokemon"],
    summary: "Get Pokemon Base Stats",
    parameters: {
        limit: Query(Number, {
            description: "取得するアイテムの最大数",
            default: 10,
            required: false
        })
    },
    responses: {
      "200": {
        description: "Successful response",
        schema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "number" },
              name: { type: "string" },
              types: {
                type: "array",
                items: { type: "number" }
              },
              base_stat: {
                type: "object",
                properties: {
                  H: { type: "string" },
                  A: { type: "string" },
                  B: { type: "string" },
                  C: { type: "string" },
                  D: { type: "string" },
                  S: { type: "string" },
                  合計: { type: "string" }
                }
              }
            }
          }
        }
      },
    }
  };


  async handle(request: Request, env: Env) {
    const url = new URL(request.url);
    const limitParam = url.searchParams.get("limit");
    const limit = limitParam && !isNaN(Number(limitParam)) ? parseInt(limitParam, 10) : 30;

    await fetchPokeData(env)
  
    // CORSヘッダーを追加
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': 'https://quiz-poke-data.pages.dev',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });

    if (!rankingData) {
        return new Response(JSON.stringify({ code: "ranking-data-not-found" }), {
          status: 500,
          headers: headers
        });
    }
    
    const data = rankingData.slice(0, limit).map(p => buildPokeData(p));
  
    return new Response(JSON.stringify(data), { headers });
  }
  
}

  let baseStats = null;
  let names = null;
  let types = null;
  let tokusei = null;
  let pokeTypeMap = null;
  let rankingData = null;

  async function fetchPokeData(env: Env) {
    baseStats = await parseCsvToArray(await env.POKEMON_DATA.get("BASE_STAT"));
    names = await JSON.parse(await env.POKEMON_DATA.get("names"));
    types = await JSON.parse(await env.POKEMON_DATA.get("types"));
    tokusei = await env.POKEMON_DATA.get("tokusei");
    pokeTypeMap = await JSON.parse(await env.POKEMON_DATA.get("poke_type_map"));
    rankingData = await getPokemonRankingData(env)
}

  async function getPokemonRankingData(env: Env) {
    let data = await env.POKEMON_DATA.get("double_battle_pokemon_ranking", "json");
  
    if (!data) {
      data = await fetchLatestDoubleBattlePokemonRanking();
      //   保存期限は24時間までにする
      //   FIXME 保存期限はランクマッチの終了日時までの条件を追加する
      await env.POKEMON_DATA.put("double_battle_pokemon_ranking", JSON.stringify(data), { expirationTtl: 86400 });
    }
  
    return data;
  }

  function buildPokeData(pokeData) {
    const name = names[pokeData["id"] - 1];
    const type = pokeTypeMap[pokeData["id"]][pokeData["form"]];
    const baseStat = BaseStat(pokeData, baseStats);

    return {
      id: pokeData["id"],
      name: name,
      type: type,
      base_stat: baseStat
    };
  }

  function BaseStat(pokeData, csvArray) {
    let baseStat = {};
    
    for (const rowData of csvArray) {
      if (parseInt(rowData['No.']) === pokeData["id"] && parseInt(rowData['form']) === pokeData["form"]) {
        baseStat = {
          H: rowData['HP'],
          A: rowData['攻撃'],
          B: rowData['防御'],
          C: rowData['特攻'],
          D: rowData['特防'],
          S: rowData['素早'],
          合計: rowData['合計']
        };
        break;
      }
    }
  
    return baseStat;
  }
  
  function parseCsvToArray(csvData) {
    const rows = csvData.split('\n');
    const headers = rows[0].split(',');
  
    return rows.slice(1).map(row => {
      const rowData = row.split(',');
      return headers.reduce((obj, header, index) => {
        obj[header] = rowData[index];
        return obj;
      }, {});
    });
  }
  