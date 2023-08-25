// import { unknownCommandResponseEmail, unknownEmailSender, successfullyDeauthed } from "./responses.js";

function responseFiller(recip, subj, message, messageID) {
	return new Request("https://api.mailchannels.net/tx/v1/send", {
		"method": "POST",
		"headers": {
			"content-type": "application/json",
			"in-reply-to": messageID,
		},
		"body": JSON.stringify({
			"personalizations": [
				{ "to": [{ "email": recip }] }
			],
			"from": {
				"email": "bot@lazemail.cc", // TODO make sure you set the correct domain and add the correct dns entries for mailchannels (TXT record: cfid= ) and add the domain to the worker
				"name": "Laze MailBot",
			},
			"subject": subj,
			"content": [{
				"type": "text/html",
				"value": message,
			}],
		}),
	});
}

async function messageId (message) {
	const id = message.headers.get("message-id");
	if (id) {
		return id;
	} else {
		throw new Error("No message id");
	}
}

async function defaultResponse(message, env, ctx) {
	const send_request = responseFiller(message.from, "Re: " + message.headers.get("subject"), "This is a default response", await messageId(message));
	const resp = await fetch(send_request);
	const respContent = resp.status + " " + resp.statusText;
	console.log("default", respContent);
	return await (respContent == "202 Accepted");
}

async function invalidSenderResponse(message, env, ctx) {
	const send_request = responseFiller(message.from, "Re: " + message.headers.get("subject"), "You do not have access to this function from your email address: " + message.from, await messageId(message));
	const resp = await fetch(send_request);
	const respContent = resp.status + " " + resp.statusText;
	console.log("invalid sender", respContent);
	return await (respContent == "202 Accepted");
}

async function simpleResponse(message, env, ctx) {
	const send_request = responseFiller(message.from, "Re: " + message.headers.get("subject"), "This is a simple response", await messageId(message));
	const resp = await fetch(send_request);
	const respContent = resp.status + " " + resp.statusText;
	console.log("simple", respContent);
	return await (respContent == "202 Accepted");
}

// Mailchannels seems to block emails sent outside of a valid fetch request, this includes blocking messages send from a service binding
// nevermind, it seems to work after adding the reciving email domain to the cfid= TXT record

const routes = {
	"default": {
		"res": defaultResponse,
		// a regex to validate the sender (any sender is valid)
		"senderValidation": /.*/,
	},
	"invalid sender": {
		"res": invalidSenderResponse,
		// a regex to validate the sender (any sender is valid)
		"senderValidation": /.*/,
	},
	"simple request": {
		"res": simpleResponse,
		// a regex to validate the sender (any sender is valid)
		"senderValidation": /.*/,
	},
	"org request": {
		"res": simpleResponse,
		// a regex to validate the sender only emails from pmail.site are valid
		"senderValidation": /.*@pmail\.site$/,
	},
	"secure request": {
		"res": simpleResponse,
		// a regex to validate the sender only emails from sec@pmail.site are valid
		"senderValidation": /^sec@pmail\.site$/,
	},
}

export default {
	async email(message, env, ctx) {
		console.log(message.from);

		var route = routes[`${message.headers.get('subject').toLowerCase()} ${ctx.request.url}`];
		if (!route) {
			console.log("no route");
			route = routes["default"];
		}
		var responded = false;
		if (route.senderValidation.test(message.from)) {
			responded = route(message, env, ctx);
		} else {
			console.log("invalid sender");
			route = routes["invalid sender"];
			responded = route(message, env, ctx);
		}
		if (responded) {
			console.log("Response sent");
			return;
		} else {
			throw new Error("No response sent");
		}
	},
	async fetch(request, env, ctx) {
		return new Response("This worker only works with email requests.", {
			status: 400,
			statusText: "Bad Request",
			});
	},
};

