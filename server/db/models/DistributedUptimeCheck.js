import mongoose from "mongoose";

import { BaseCheckSchema } from "./Check.js";

// {
// 	"id": "12123",
// 	"result": {
// 	  "task_arrived": "2025-01-13T19:21:37.463466602Z",
// 	  "dns_start": "2025-01-14T00:21:33.1801319+05:00",
// 	  "dns_end": "2025-01-14T00:21:33.4582552+05:00",
// 	  "conn_start": "2025-01-14T00:21:33.1801319+05:00",
// 	  "conn_end": "2025-01-14T00:21:33.7076318+05:00",
// 	  "connect_start": "2025-01-14T00:21:33.4582552+05:00",
// 	  "connect_end": "2025-01-14T00:21:33.541899+05:00",
// 	  "tls_hand_shake_start": "2025-01-14T00:21:33.541899+05:00",
// 	  "tls_hand_shake_end": "2025-01-14T00:21:33.7076318+05:00",
// 	  "body_read_start": "2025-01-14T00:21:34.1894707+05:00",
// 	  "body_read_end": "2025-01-14T00:21:34.1894707+05:00",
// 	  "wrote_request": "2025-01-14T00:21:33.7076318+05:00",
// 	  "got_first_response_byte": "2025-01-14T00:21:34.1327652+05:00",
// 	  "first_byte_took": 425133400,
// 	  "body_read_took": 56030000,
// 	  "dns_took": 278123300,
// 	  "conn_took": 527499900,
// 	  "connect_took": 83643800,
// 	  "tls_took": 165732800,
// 	  "sni_name": "uprock.com",
// 	  "status_code": 200,
// 	  "body_size": 19320,
// 	  "request_header_size": 95,
// 	  "response_header_size": 246,
// 	  "response_headers": "X-Vercel-Id: bom1::iad1::sm87v-1736796096856-aec270c01f23\nDate: Mon, 13 Jan 2025 19:21:37 GMT\nServer: Vercel\nStrict-Transport-Security: max-age=63072000\nVary: RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Url\nX-Matched-Path: /\nX-Powered-By: Next.js\nX-Vercel-Cache: MISS\nAge: 0\nCache-Control: private, no-cache, no-store, max-age=0, must-revalidate\nContent-Type: text/html; charset=utf-8",
// 	  "error": "",
// 	  "device_id": "d5f578e143a2cd603dd6bf5f846a86a538bde4a8fbe2ad1fca284ad9f033daf8",
// 	  "ip_address": "223.123.19.0",
// 	  "proof": "",
// 	  "created_at": "2025-01-13T19:21:37.463466912Z",
// 	  "continent": "AS",
// 	  "country_code": "PK",
// 	  "city": "Muzaffargarh",
// 	  "upt_burnt" : "0.01",
// 	  "location": {
// 		"lat": 71.0968,
// 		"lng": 30.0208
// 	  },
// 	  "payload": {
// 		"callback": "https://webhook.site/2a15b0af-545a-4ac2-b913-153b97592d7a",
// 		"x": "y"
// 	  }
// 	}
//   }

const LocationSchema = new mongoose.Schema(
	{
		lat: { type: Number, required: true },
		lng: { type: Number, required: true },
	},
	{ _id: false }
);

const DistributedUptimeCheckSchema = mongoose.Schema(
	{
		...BaseCheckSchema.obj,
		first_byte_took: {
			type: Number,
			required: false,
		},
		body_read_took: {
			type: Number,
			required: false,
		},
		dns_took: {
			type: Number,
			required: false,
		},
		conn_took: {
			type: Number,
			required: false,
		},
		connect_took: {
			type: Number,
			required: false,
		},
		tls_took: {
			type: Number,
			required: false,
		},
		location: {
			type: LocationSchema,
			required: false,
		},
		continent: {
			type: String,
			required: false,
		},
		countryCode: {
			type: String,
			required: false,
		},
		city: {
			type: String,
			required: false,
		},
		uptBurnt: {
			type: mongoose.Schema.Types.Decimal128,
			required: false,
		},
		count: {
			type: Number,
			required: false,
		},
	},
	{ timestamps: true }
);

DistributedUptimeCheckSchema.pre("save", function (next) {
	if (this.isModified("uptBurnt") && typeof this.uptBurnt === "string") {
		this.uptBurnt = mongoose.Types.Decimal128.fromString(this.uptBurnt);
	}
	next();
});

DistributedUptimeCheckSchema.index({ createdAt: 1 });
DistributedUptimeCheckSchema.index({ monitorId: 1, updatedAt: 1 });
DistributedUptimeCheckSchema.index({ monitorId: 1, updatedAt: -1 });
DistributedUptimeCheckSchema.index(
	{
		monitorId: 1,
		createdAt: -1,
		city: 1,
		"location.lat": 1,
		"location.lng": 1,
		responseTime: 1,
	},
	{ background: true }
);
export default mongoose.model("DistributedUptimeCheck", DistributedUptimeCheckSchema);
