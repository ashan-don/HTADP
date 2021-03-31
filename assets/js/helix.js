/**
 * Custom tracking scripts for Helix Jekyll-based microsites
 */

'use strict';

function getQueryVariable(variable) {
	var query = window.location.search.substring(1);
	var vars = query.split('&');
	for (var i = 0; i < vars.length; i++) {
		var pair = vars[i].split('=');
		if (decodeURIComponent(pair[0]) == variable) {
			return decodeURIComponent(pair[1]);
		}
	}
}

if (typeof Cookies.getJSON('helix') == "undefined") {
	var helix = {};
} else {
	var helix = Cookies.getJSON('helix');
}

// tracking/search variables from querystring if applicable
var trackingVars = ["source_code", "source_campaign_id", "affiliateID", "affiliate_id", "dart_code", "search_keyword", "search_type", "search_campaign", "netid", "cmid", "agid", "adid", "adpos", "dvt", "ptid", "gclid", "ef_id", "utm_campaign", "utm_campaign_id", "test_id", "test_variant"];

if (window.location.search != "") {
	trackingVars.forEach(function (trackingVar) {
		if (typeof getQueryVariable(trackingVar) != "undefined") {
			helix[trackingVar] = getQueryVariable(trackingVar);
		}
	});
}

// Check for any page-level overrides
if (typeof window.sourceCodeOverride != "undefined") {
	helix['source_code'] = window.sourceCodeOverride;
}

/**
 * Append querystring to any designated tracking links (ie. application site)
 */
// IE Polyfill to allow forEach on NodeList's (https://developer.mozilla.org/en-US/docs/Web/API/NodeList/forEach#Polyfill)
if (window.NodeList && !NodeList.prototype.forEach) {
	NodeList.prototype.forEach = Array.prototype.forEach;
}
// Add event listener to relevant links
var trackingLinks = document.querySelectorAll('a[data-tracking-template=true]');
trackingLinks.forEach(function (trackingLink) {
	trackingLink.addEventListener('click', function (e) {
		e.preventDefault();
		var querystring = "";
		trackingVars.forEach(function (trackingVar) {
			if (typeof helix[trackingVar] != "undefined") {
				if (querystring != "") querystring += "&";
				querystring += trackingVar + "=" + helix[trackingVar];
			}
		});

		if (querystring != "") {
			trackingLink.href += "?" + querystring;
		}
		window.location = trackingLink.href;
	});
});

// Set everything back to the cookie
Cookies.set('helix', helix, { expire: 30 });

// Check for Google Optimize tests
// (because of the asynchronous nature of this, we will re-read
// the cookie and re-set it after doing all our other stuff above ^^)
if (typeof gtag == "undefined" && typeof dataLayer != "undefined") {
	var gtag = function gtag() {
		dataLayer.push(arguments);
	};
	gtag('event', 'optimize.callback', {
		callback: function callback(value, name) {
			console.log('Experiment with ID: ' + name + ' is on variant: ' + value);
			var helix = Cookies.getJSON('helix');
			helix['test_id'] = name;
			helix['test_variant'] = value;
			Cookies.set('helix', helix, { expire: 30 });
			window.helix = Cookies.getJSON('helix');
		}
	});
}