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
				"email": "deauth@lineonline.app",
				"name": "LineOnLine Deauthenticator",
			},
			"subject": subj,
			"content": [{
				"type": "text/html",
				"value": message,
			}],
		}),
	});
}

async function unknownCommandResponseEmail(recip, command, messageID) {
	function format(command) {
		const html = `
		<h1 style="color: black;">Unknown Command: |COMMANDHERE|</h1>
		<h2>In regards to your earlier email. The only valid command is "Deauth" (no quotes)</h2>
		<h3>To use put the command in the subject line of an email to this address (content does not matter only subject)</h3>
		<h3>Do not reply to this email as the subject will not change and you will get this email again</h3>
		`
		const htmlWCode = html.replace("|COMMANDHERE|", command);
		return htmlWCode;
	}
	const send_request = responseFiller(recip, "Re: " + command, format(command), messageID);
	const resp = await fetch(send_request);
	const respContent = resp.status + " " + resp.statusText;
	console.log("ucr", respContent);
	return await (respContent == "202 Accepted");
}

async function unknownEmailSender(recip, messageID) {
	function format(from) {
		const html = `
		<h1 style="color: black;">Unknown Email</h1>
		<h2>You send an email from an address that is unknown to this server: |EMAILHERE|</h2>
		`
		const htmlWCode = html.replace("|EMAILHERE|", from);
		return htmlWCode;
	}
	const send_request = responseFiller(recip, "Re: Deauth", format(recip), messageID);
	const resp = await fetch(send_request);
	const respContent = resp.status + " " + resp.statusText;
	console.log("ues", respContent);
	return await (respContent == "202 Accepted");
}

async function successfullyDeauthed(recip, date, messageID) {
	function format(from, date) {
		const html = `
		<h1 style="color: black;">All Old Tokens Are Now Being Blocked</h1>
		<h2>The email which you sent from |EMAILHERE| to this address with the subject/command "Deauth" has been successfull.</h2>
		<h4>Any tokens which were created before |DATEHERE| will no longer be valid.</h4>
		`
		const htmlWCode = html.replace("|DATEHERE|", date).replace("|EMAILHERE|", from);
		console.log(htmlWCode);
		return htmlWCode;
	}
	const send_request = responseFiller(recip, "Re: Deauth", format(recip, date), messageID);
	const resp = await fetch(send_request);
	const respContent = resp.status + " " + resp.statusText;
	console.log("sda", respContent);
	return await (respContent == "202 Accepted");
}

export { unknownCommandResponseEmail, unknownEmailSender, successfullyDeauthed };
