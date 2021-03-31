'use strict';

window.addEventListener('DOMContentLoaded', function (e) {
	// Mobile menu button toggle
	var menuButton = document.querySelector('li.menu-button button');
	if (menuButton) {
		menuButton.addEventListener('click', function (e) {
			e.preventDefault();
			document.body.classList.toggle('open');
		});
	}

	/**
  * YouTube players
  */
	var ytApiKey = "AIzaSyDsjKP5ZN-hCR2i1bq-lM7_RPplOo4V-pI";
	// go through each video module
	document.querySelectorAll('div.video').forEach(function (video) {
		// get thumbnail from YouTube if none is pre-defined
		if (typeof video.dataset.frame == "undefined") {
			(function () {
				// get the video id
				var videoId = video.dataset.videoId;
				// query YouTube API for thumbnail
				var req = new XMLHttpRequest();
				req.addEventListener('load', function () {
					var data = JSON.parse(req.responseText);
					var thumbnailUrl = data.items[0].snippet.thumbnails.standard.url;
					video.style.backgroundImage = "url('" + thumbnailUrl + "')";
				});
				req.open('GET', 'https://www.googleapis.com/youtube/v3/videos?id=' + videoId + '&key=' + ytApiKey + '&part=snippet&fields=items(snippet/thumbnails/standard)');
				req.send();
			})();
		}
	});
	document.querySelectorAll('div.video a').forEach(function (link) {
		link.addEventListener('click', function (e) {
			e.preventDefault();
			var parent = link.getParent('.video');
			parent.innerHTML = parent.innerHTML.replace(/(<!--|-->)/g, '');
		});
	});

	/**
 * Initialize forms
 */

	// Set global validation rules
	var formValidationObj = {
		'program_code': [{
			'type': 'required',
			'message': 'Please select a program you wish to learn more about'
		}],
		'campus_code': [{
			'type': 'required'
		}],
		'first_name': [{
			'type': 'required'
		}],
		'last_name': [{
			'type': 'required'
		}],
		'email': [{
			'type': 'required'
		}, {
			'type': 'email'
		}],
		'phone': [{
			'type': 'required'
		}, {
			'type': 'phone'
		}],
		'postal_code': [{
			'type': 'required'
		}, {
			'type': 'postal_code'
		}],
		'work_experience': [{
			'type': 'required'
		}]
	};

	// iterate through all forms and initialize
	window['helixForms'] = []; // global variable for debugging

	document.querySelectorAll('form.helixform').forEach(function (form) {
		var newForm = new HelixForm();
		newForm.submitButtonText = "Request Info";
		newForm.initialize(form);
		newForm.validation = formValidationObj;
		newForm.submissionRedirectUrl = '/thank-you/';
		helixForms.push(newForm);
	});

	/**
 * Campus filtering based on program selection
 */
	document.querySelectorAll('select[name="program_code"]').forEach(function (programField) {
		programField.addEventListener('change', function () {
			//console.log(programField)
			updateCampusesByProgram(programField);
		});
	});

	/**
  * on page load, cycle through any prefilled program inputs,
  * and update campuses accordingly
  */
	document.querySelectorAll('[name="program_code"]').forEach(function (programField) {
		if (programField.value != "") {
			updateCampusesByProgram(programField);
		}
	});

	/**
  * Initialize dialog (modal)
  */
	var dialog = document.querySelector('#dialog-form');
	dialogPolyfill.registerDialog(dialog);

	var formLinks = document.querySelectorAll('a[data-dialog-form="true"]');
	for (var i = 0; i < formLinks.length; i++) {
		formLinks[i].addEventListener('click', function (event) {
			event.preventDefault();
			dialog.showModal();
			dialog.querySelectorAll('input,select')[0].focus();
		});
	}

	var dialogCollateral = document.querySelector('#dialog-form-collateral');
	dialogPolyfill.registerDialog(dialogCollateral);

	var collateralFormLinks = document.querySelectorAll('a[data-dialog-collateral="true"]');
	for (var i = 0; i < collateralFormLinks.length; i++) {
		collateralFormLinks[i].addEventListener('click', function (event) {
			event.preventDefault();
			// set collateral cookie
			if (typeof this.dataset.collateralFile != "undefined") {
				Cookies.set('collateralFile', this.dataset.collateralFile);
			}
			dialogCollateral.showModal();
			dialogCollateral.querySelectorAll('input,select')[0].focus();
		});
	}

	/**
  * Show Collateral Download
  */
	var collateralDownloadModule = document.querySelector('.collateral.collateral-download');

	if (collateralDownloadModule && Cookies.get('collateralFile')) {
		var collateralFile = collateralFiles[Cookies.get('collateralFile')];
		if (typeof collateralFile != "undefined") {
			collateralDownloadModule.style.display = "block";
			collateralDownloadModule.querySelector('.img-wrapper img').src += collateralFile.thumbnail;
			collateralDownloadModule.querySelector('h2 + p').innerHTML = collateralFile.title;
			collateralDownloadModule.querySelector('a.button').href += collateralFile.filename;
		}
	}

	/**
  * close dialog
  */
	document.querySelector('#dialog-form .dialog-close').addEventListener('click', function (e) {
		e.preventDefault();
		dialog.close();
	});
	document.querySelector('#dialog-form-collateral .dialog-close').addEventListener('click', function (e) {
		e.preventDefault();
		dialogCollateral.close();
	});

	// listen for any clicks, close if the parent is the dialog itself and not the <section> inside
	// this effectively creates a close action on the backdrop element
	dialog.addEventListener('click', function (e) {
		if (e.target.id == 'dialog-form') {
			dialog.close();
		}
	});
	dialogCollateral.addEventListener('click', function (e) {
		if (e.target.id == 'dialog-form-collateral') {
			dialogCollateral.close();
		}
	});

	/**
  * Dynamic application CTA message
  */
	var dynamicCTAModule = document.querySelector('.cta.dynamic');
	if (dynamicCTAModule) {
		var longTermMessage = dynamicCTAModule.querySelector('.long-term');
		var shortTermMessage = dynamicCTAModule.querySelector('.short-term');

		// Turn off the short term message
		shortTermMessage.style.display = "none";

		// Turn on the short term message if we're in a favorable date range
		var months = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];
		var now = new Date();
		var startThreshold = 60; // start showing two months before the start date
		var endThreshold = 14; // stop two weeks before the start date
		for (var i = 0; i < allStartDates.length; i++) {
			var date = allStartDates[i].split('/');
			var newDate = new Date(date[2], date[0] - 1, date[1]);
			if (now.getTime() > newDate.getTime() - startThreshold * 24 * 60 * 60 * 1000 && now.getTime() < newDate.getTime() - endThreshold * 24 * 60 * 60 * 1000) {
				//console.log(newDate)
				shortTermMessage.style.display = "block";
				longTermMessage.style.display = "none";
				var cutoffReplacement = dynamicCTAModule.querySelector('span.cutoff');
				var cutoffDate = new Date(newDate.getTime() - endThreshold * 24 * 60 * 60 * 1000);
				cutoffReplacement.innerHTML = months[cutoffDate.getMonth()] + ' ' + cutoffDate.getDate();
				break;
			}
		}
	}

	/**
 * Global start date replacement
 */
	if (typeof window.startAfter == "undefined") var startAfter = "01/01/2000";else var startAfter = window.startAfter;
	startAfter = startAfter.split('/');
	var startAfterDate = new Date(startAfter[2], startAfter[0] - 1, startAfter[1]);
	var months = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];
	var now = new Date();
	var threshold = 14; // number of days ahead it switches
	for (var i = 0; i < allStartDates.length; i++) {
		var date = allStartDates[i].split('/');
		var newDate = new Date(date[2], date[0] - 1, date[1]);
		if (newDate.getTime() >= now.getTime() + threshold * 24 * 60 * 60 * 1000 && newDate >= startAfterDate) {
			var dateReplacements = document.querySelectorAll('.date-replace');
			dateReplacements.forEach(function (dateReplacement) {
				if (dateReplacement.classList.contains('short')) {
					if (dateReplacement.classList.contains('month-name')) {
						dateReplacement.innerHTML = months[date[0]] + ' ' + date[1];
					} else {
						dateReplacement.innerHTML = date[0] + '/' + date[1];
					}
				} else {
					dateReplacement.innerHTML = "as soon as <strong>" + date[0] + '/' + date[1] + "</strong>";
				}
			});
			break;
		}
	}
});

function updateCampusesByProgram(programField) {
	// get a list of valid campuses for this program
	var program = programField.value;
	var validCampuses = [];
	findCampuses.forEach(function (campus) {
		var match = false;
		campus.programs.forEach(function (p) {
			if (p.programCode == program) {
				match = true;
			}
		});

		if (match) {
			validCampuses.push(campus.campusCode);
		}
	});

	// hide the labels for any invalid campuses
	var campusFields = programField.getParent('form').querySelectorAll('input[name="campus_code"]');
	campusFields.forEach(function (campusField) {
		if (validCampuses.indexOf(campusField.value) < 0) {
			campusField.nextElementSibling.style.display = "none";
			campusField.checked = false;
		} else {
			campusField.nextElementSibling.style.display = "block";
		}
	});

	// if only one valid campus, check it and hide the parent containing element
	if (validCampuses.length <= 1) {
		programField.getParent('form').querySelector('input[name="campus_code"][value="' + validCampuses[0] + '"]').checked = true;
		programField.getParent('form').querySelector('.form-field.campus_code').style.display = "none";
	}

	if (validCampuses.length > 1) {
		programField.getParent('form').querySelector('.form-field.campus_code').style.display = "block";
	}
}

Node.prototype.getParent = function (selector) {
	var element = this;
	while (element = element.parentElement) {
		if (element.matches(selector)) {
			return element;
			break;
		}
	}
};

var findCampuses = [{ "campusId": 9081, "customerId": 9079, "name": "Austin", "campusCode": "HUS5140", "externalCampusCode": "", "approvedPostalCodes": "73301,73344,76501,76502,76503,76504,76505,76508,76511,76513,76533,76534,76540,76541,76542,76543,76544,76547,76548,76549,76554,76559,76564,76569,76571,76574,76579,78617,78626,78627,78628,78633,78634,78641,78645,78646,78653,78660,78664,78665,78681,78682,78683,78690,78691,78701,78702,78703,78704,78705,78708,78709,78710,78711,78712,78713,78714,78715,78716,78717,78718,78719,78720,78721,78722,78723,78724,78725,78726,78727,78728,78729,78730,78731,78732,78733,78734,78735,78736,78737,78738,78739,78741,78742,78744,78745,78746,78747,78748,78749,78750,78751,78752,78753,78754,78755,78756,78757,78758,78759,78760,78761,78762,78763,78764,78765,78766,78767,78768,78769,78772,78773,78774,78778,78779,78783,78799,79698", "postOfficeBox": "", "extendedAddress": "", "streetAddress": "900 Chicon Street", "city": "Austin", "state": "TX", "postalCode": "78702", "country": "", "phone": "", "email": "", "fax": null, "otherData": null, "created": "2014-08-13 00:00:00", "modified": "2014-08-13 00:00:00", "programs": [{ "programId": 7746, "customerId": 9079, "degreeLevelId": 2, "collegeId": 0, "name": "Associate of Arts in Liberal Arts", "displayName": "Liberal Arts, AA", "programCode": "AALA", "customerProgramName": "", "customerProgramCode": null, "emphasis": "", "degreeLevel": { "degreeLevelId": 2, "name": "Associate's", "abbreviation": "A", "orderLevel": 200, "created": "2017-12-11 10:43:52.844472", "modified": "2017-12-11 10:43:52.844472", "disabled": false }, "concentration": null, "created": "2017-12-11 10:38:48.456728", "modified": "2020-08-18 18:56:20.782619", "disabled": false }, { "programId": 7747, "customerId": 9079, "degreeLevelId": 4, "collegeId": 0, "name": "Bachelor of Arts in Business Administration", "displayName": "Business Administration, BA", "programCode": "BABA", "customerProgramName": "", "customerProgramCode": null, "emphasis": "", "degreeLevel": { "degreeLevelId": 4, "name": "Bachelor's", "abbreviation": "B", "orderLevel": 400, "created": "2017-12-11 10:43:52.844472", "modified": "2017-12-11 10:43:52.844472", "disabled": false }, "concentration": null, "created": "2017-12-11 10:38:48.456728", "modified": "2020-08-18 18:56:39.538507", "disabled": false }, { "programId": 7748, "customerId": 9079, "degreeLevelId": 4, "collegeId": 0, "name": "Bachelor of Arts in Criminal Justice", "displayName": "Criminal Justice, BA", "programCode": "BACJ", "customerProgramName": "", "customerProgramCode": null, "emphasis": "", "degreeLevel": { "degreeLevelId": 4, "name": "Bachelor's", "abbreviation": "B", "orderLevel": 400, "created": "2017-12-11 10:43:52.844472", "modified": "2017-12-11 10:43:52.844472", "disabled": false }, "concentration": null, "created": "2017-12-11 10:38:48.456728", "modified": "2020-08-18 18:56:50.082181", "disabled": false }, { "programId": 7749, "customerId": 9079, "degreeLevelId": 4, "collegeId": 0, "name": "Bachelor of Arts in Elementary Education with EC-6 Generalist Certification", "displayName": "Elementary Education, BA", "programCode": "BAED", "customerProgramName": "", "customerProgramCode": null, "emphasis": "", "degreeLevel": { "degreeLevelId": 4, "name": "Bachelor's", "abbreviation": "B", "orderLevel": 400, "created": "2017-12-11 10:43:52.844472", "modified": "2017-12-11 10:43:52.844472", "disabled": false }, "concentration": null, "created": "2017-12-11 10:38:48.456728", "modified": "2020-08-18 18:57:04.757993", "disabled": false }, { "programId": 7750, "customerId": 9079, "degreeLevelId": 4, "collegeId": 0, "name": "Bachelor of Arts in Psychology", "displayName": "Psychology, BA", "programCode": "BPSY", "customerProgramName": "", "customerProgramCode": null, "emphasis": "", "degreeLevel": { "degreeLevelId": 4, "name": "Bachelor's", "abbreviation": "B", "orderLevel": 400, "created": "2017-12-11 10:43:52.844472", "modified": "2017-12-11 10:43:52.844472", "disabled": false }, "concentration": null, "created": "2017-12-11 10:38:48.456728", "modified": "2020-08-18 18:57:17.759781", "disabled": false }], "online": false, "disabled": false }, { "campusId": 12066, "customerId": 9079, "name": "Online", "campusCode": "HUS5141", "externalCampusCode": null, "approvedPostalCodes": null, "postOfficeBox": null, "extendedAddress": null, "streetAddress": null, "city": null, "state": null, "postalCode": null, "country": null, "phone": null, "email": null, "fax": null, "otherData": null, "created": "2020-08-12 01:38:42.717284", "modified": "2020-08-12 01:48:51.520643", "programs": [{ "programId": 7746, "customerId": 9079, "degreeLevelId": 2, "collegeId": 0, "name": "Associate of Arts in Liberal Arts", "displayName": "Liberal Arts, AA", "programCode": "AALA", "customerProgramName": "", "customerProgramCode": null, "emphasis": "", "degreeLevel": { "degreeLevelId": 2, "name": "Associate's", "abbreviation": "A", "orderLevel": 200, "created": "2017-12-11 10:43:52.844472", "modified": "2017-12-11 10:43:52.844472", "disabled": false }, "concentration": null, "created": "2017-12-11 10:38:48.456728", "modified": "2020-08-18 18:56:20.782619", "disabled": false }, { "programId": 10268, "customerId": 9079, "degreeLevelId": 16, "collegeId": 0, "name": "Master of Business Administration", "displayName": "Master of Business Administration", "programCode": "MBA", "customerProgramName": null, "customerProgramCode": null, "emphasis": null, "degreeLevel": { "degreeLevelId": 16, "name": "Master's", "abbreviation": "M", "orderLevel": 600, "created": "2017-12-11 10:43:52.844472", "modified": "2017-12-11 10:43:52.844472", "disabled": false }, "concentration": null, "created": "2020-08-12 01:47:34.650740", "modified": "2020-08-19 21:30:55.656454", "disabled": false }], "online": true, "disabled": false }];
var allStartDates = ["5/4/2021", "8/24/2021", "10/19/2021"];
var collateralFiles = { "business-administration": { "filename": "HT BA Business Administration.pdf", "title": "Business Administration, BA Program Guide", "thumbnail": "thumbnails/business-administration.jpg" }, "criminal-justice": { "filename": "HT BA Criminal Justice.pdf", "title": "Criminal Justice, BA Program Guide", "thumbnail": "thumbnails/criminal-justice.jpg" }, "elementary-education": { "filename": "HT BA Elementary Education.pdf", "title": "Elementary Education, BA Program Guide", "thumbnail": "thumbnails/elementary-education.jpg" }, "liberal-arts": { "filename": "HT AA Liberal Arts.pdf", "title": "Liberal Arts, AA Program Guide", "thumbnail": "thumbnails/liberal-arts.jpg" }, "psychology": { "filename": "HT BA Psychology.pdf", "title": "Psychology, BA Program Guide", "thumbnail": "thumbnails/psychology.jpg" }, "financial-aid": { "filename": "HT Financial Aid.pdf", "title": "Financial Aid For Beginners", "thumbnail": "thumbnails/financial-aid.jpg" }, "mba": { "filename": "HT MBA.pdf", "title": "MBA Program Guide", "thumbnail": "thumbnails/mba.jpg" } };