import mongoose from "mongoose";
import { MonitorModel } from "../dist/domain/monitors/monitor.model.js";
import { UserModel } from "../dist/domain/users/user.model.js";

// Seeds a large number of HTTP monitors against real, resolving domains so the
// scheduler can be exercised under load. Run after `npm run build` (imports the
// compiled models from dist/, like scripts/generate-checks.js).
//
//   node scripts/seed-monitors.js                 # 10k monitors, owner auto-detected
//   COUNT=2000 INTERVAL=30000 node scripts/seed-monitors.js
//   CLEAR=true node scripts/seed-monitors.js      # remove prior seed monitors first
//   TEAM_ID=<id> USER_ID=<id> node scripts/seed-monitors.js
//
// NOTE: the running queue only schedules monitors it finds at init(), so restart
// the server after seeding for the new monitors to actually start checking.

const DEFAULT_COUNT = 500;
const DEFAULT_BATCH = 1_000;
const DEFAULT_INTERVAL = 60_000;
const NAME_PREFIX = "Seed";
// Stored in `description` so a re-run with CLEAR=true can find and remove them.
const SEED_MARKER = "checkmate-scaling-seed";

// A spread of well-known, reliably-resolving domains across regions, TLDs and
// CDNs. Monitors round-robin through this pool, so the load is split across many
// hosts rather than hammering one. Every entry returns a real HTTP response
// (some may 403/429 under load — still a valid response for scaling purposes).
const DOMAINS = [
	"google.com",
	"youtube.com",
	"facebook.com",
	"wikipedia.org",
	"amazon.com",
	"reddit.com",
	"x.com",
	"instagram.com",
	"linkedin.com",
	"microsoft.com",
	"apple.com",
	"cloudflare.com",
	"github.com",
	"gitlab.com",
	"stackoverflow.com",
	"netflix.com",
	"bing.com",
	"yahoo.com",
	"duckduckgo.com",
	"mozilla.org",
	"wordpress.org",
	"wordpress.com",
	"adobe.com",
	"salesforce.com",
	"oracle.com",
	"ibm.com",
	"intel.com",
	"nvidia.com",
	"amd.com",
	"dell.com",
	"hp.com",
	"cisco.com",
	"vmware.com",
	"redhat.com",
	"ubuntu.com",
	"debian.org",
	"kernel.org",
	"python.org",
	"nodejs.org",
	"npmjs.com",
	"docker.com",
	"kubernetes.io",
	"golang.org",
	"rust-lang.org",
	"php.net",
	"ruby-lang.org",
	"java.com",
	"spring.io",
	"djangoproject.com",
	"flask.palletsprojects.com",
	"vuejs.org",
	"reactjs.org",
	"angular.io",
	"svelte.dev",
	"jquery.com",
	"npm.im",
	"pypi.org",
	"rubygems.org",
	"packagist.org",
	"maven.apache.org",
	"apache.org",
	"nginx.org",
	"postgresql.org",
	"mysql.com",
	"mongodb.com",
	"redis.io",
	"elastic.co",
	"grafana.com",
	"prometheus.io",
	"hashicorp.com",
	"digitalocean.com",
	"linode.com",
	"vultr.com",
	"heroku.com",
	"netlify.com",
	"vercel.com",
	"render.com",
	"fly.io",
	"railway.app",
	"cloudinary.com",
	"twilio.com",
	"stripe.com",
	"paypal.com",
	"shopify.com",
	"squarespace.com",
	"wix.com",
	"godaddy.com",
	"namecheap.com",
	"name.com",
	"gandi.net",
	"bbc.co.uk",
	"theguardian.com",
	"nytimes.com",
	"washingtonpost.com",
	"cnn.com",
	"reuters.com",
	"bloomberg.com",
	"forbes.com",
	"wsj.com",
	"economist.com",
	"nature.com",
	"sciencedirect.com",
	"arxiv.org",
	"mit.edu",
	"stanford.edu",
	"harvard.edu",
	"berkeley.edu",
	"ox.ac.uk",
	"cam.ac.uk",
	"ethz.ch",
	"spotify.com",
	"soundcloud.com",
	"twitch.tv",
	"vimeo.com",
	"dailymotion.com",
	"imdb.com",
	"wikimedia.org",
	"archive.org",
	"ietf.org",
	"w3.org",
	"who.int",
	"un.org",
	"europa.eu",
	"gov.uk",
	"canada.ca",
	"alibaba.com",
	"aliexpress.com",
	"baidu.com",
	"tencent.com",
	"naver.com",
	"rakuten.co.jp",
	"yandex.com",
	"ozon.ru",
	"mercadolibre.com",
	"flipkart.com",
	"booking.com",
	"airbnb.com",
	"expedia.com",
	"tripadvisor.com",
	"uber.com",
	"dropbox.com",
	"box.com",
	"atlassian.com",
	"trello.com",
	"notion.so",
	"slack.com",
	"zoom.us",
	"asana.com",
	"figma.com",
	"canva.com",
];

const parseObjectId = (value) => {
	if (!value) return null;
	try {
		return new mongoose.Types.ObjectId(value);
	} catch {
		console.warn(`Ignoring invalid ObjectId '${value}'`);
		return null;
	}
};

// Monitors need a real teamId/userId to show up for an account and to be picked
// up by the queue. Prefer explicit env ids, otherwise derive from the oldest
// existing user (the typical single-tenant dev setup).
async function resolveOwner() {
	const teamId = parseObjectId(process.env.TEAM_ID);
	const userId = parseObjectId(process.env.USER_ID);
	if (teamId && userId) return { teamId, userId };

	const user = await UserModel.findOne(userId ? { _id: userId } : {}).sort({ createdAt: 1 });
	if (!user?.teamId) {
		throw new Error(
			"Could not determine an owner: no existing user with a teamId. " + "Create an account first, or pass TEAM_ID and USER_ID explicitly."
		);
	}
	return { teamId: teamId ?? user.teamId, userId: user._id };
}

async function run() {
	const mongoUri = process.env.MONGO_URI ?? "mongodb://localhost:27017/uptime_db";
	const total = Number(process.env.COUNT ?? DEFAULT_COUNT);
	const batchSize = Number(process.env.BATCH_SIZE ?? DEFAULT_BATCH);
	const interval = Number(process.env.INTERVAL ?? DEFAULT_INTERVAL);

	console.log(`Connecting to MongoDB at ${mongoUri}`);
	await mongoose.connect(mongoUri);

	const { teamId, userId } = await resolveOwner();

	if (process.env.CLEAR === "true") {
		const { deletedCount } = await MonitorModel.deleteMany({ description: SEED_MARKER });
		console.log(`Removed ${deletedCount} previously seeded monitors`);
	}

	console.log(
		`Seeding ${total} http monitors for team ${teamId} (user ${userId}) across ${DOMAINS.length} domains, ` +
			`interval ${interval}ms, in batches of ${batchSize}`
	);

	const docs = [];
	const startTime = Date.now();
	let inserted = 0;

	for (let i = 0; i < total; i += 1) {
		const domain = DOMAINS[i % DOMAINS.length];
		docs.push({
			userId,
			teamId,
			name: `${NAME_PREFIX} ${String(i + 1).padStart(5, "0")} ${domain}`,
			description: SEED_MARKER,
			type: "http",
			url: `https://${domain}`,
			isActive: true,
			interval,
			lastEvaluatedAt: 0, // evaluator watermark; without it findUnevaluatedByMonitorId gets new Date(undefined)
		});

		if (docs.length === batchSize) {
			await MonitorModel.insertMany(docs, { ordered: false });
			inserted += docs.length;
			console.log(`Inserted ${inserted} / ${total}`);
			docs.length = 0;
		}
	}

	if (docs.length > 0) {
		await MonitorModel.insertMany(docs, { ordered: false });
		inserted += docs.length;
	}

	await mongoose.disconnect();
	const duration = ((Date.now() - startTime) / 1000).toFixed(2);
	console.log(`Finished inserting ${inserted} monitors in ${duration}s`);
	console.log("Restart the server so the queue schedules the new monitors.");
}

run().catch((error) => {
	console.error("Failed to seed monitors", error);
	process.exit(1);
});
