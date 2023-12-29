import { OpenAPIRouter } from "@cloudflare/itty-router-openapi";
import { PokeData } from "./endpoints/pokeData";

export const router = OpenAPIRouter({
	docs_url: "/",
});

router.get("/api/pokedata/", PokeData);

// 404 for everything else
router.all("*", () =>
	Response.json(
		{
			success: false,
			error: "Route not found",
		},
		{ status: 404 }
	)
);

export default {
	fetch: router.handle,
};
