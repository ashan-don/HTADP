/**
 * Scripts for inquiry form
 */

function HelixForm() {
	this.form = null;
	this.steps = null;
	this.fields = null;
	this.currentStep = null;
	this.debug = false;
	this.validation = {};
	this.hasProgressIndicator = null;
	this.submitButtonText = 'Submit';
	this.submissionRedirectUrl = '/thank-you/';

	this.initialize = function(selector) {
		var obj = this;

		switch (typeof selector) {
			case "object":
				this.form = selector;
				foo = this.form;
				break;
			default: // assume "string"
				this.form = document.querySelector(selector);
				break;
		}
		
		this.fields = this.form.querySelectorAll('.form-field input, .form-field select, .form-field textarea');

		this.hasProgressIndicator = this.form.querySelector('.form-header') != null;

		// hide all steps except first
		this.steps = this.form.querySelectorAll('.form-step');
		for (var i = 1; i < this.steps.length;  i++) {
			this.steps[i].style.display = "none";
		}
		this.currentStep = 1;

		if (this.debug) {
			console.log('Total steps: ' + this.steps.length);
			console.log('Starting on step ' + this.currentStep);
		}

		// set initial progress status
		if (typeof this.steps[0] != "undefined") {
			var progress = this.steps[0].dataset.progress;
		} else {
			var progress = 50;
		}
		this.updateProgress(progress);

		// attach event listeners
		var nextButtons = this.form.querySelectorAll('.form-next button');
		for (var i = 0; i < nextButtons.length; i++) {
			nextButtons[i].addEventListener('click', function(e){
				e.preventDefault();
				obj.goStep('next');
			});
		}

		var prevButtons = this.form.querySelectorAll('.form-previous button');
		for (var i = 0; i < prevButtons.length; i++) {
			prevButtons[i].addEventListener('click', function(){
				obj.goStep('previous');
			});
		}
		for (var i = 0; i < this.fields.length; i++) {
			this.fields[i].addEventListener('change', function(){
				obj.validateInput(this);
			});
		}
	}

	this.updateProgress = function(progress) {
		if (this.hasProgressIndicator) {
			this.form.querySelector('.form-progress-meter-fill').style.width = progress + "%";
			this.form.querySelector('.form-progress-percent').innerText = progress;
		}
		/*
		// update buttons as necessary 
		var previous = this.form.querySelector('.form-previous');
		var nextButton = this.form.querySelector('.form-next button');

		if (this.currentStep == 1) {
			previous.style.display = "none";
		} else {
			previous.style.display = "block";
		}

		if (this.currentStep == this.steps.length) {
			nextButton.innerHTML = this.submitButtonText;
		} else {
			nextButton.innerHTML = "Next &rarr;";
		}
		*/
		if (this.debug) {
			console.log('Progress: ' + progress + '%');
		}
	}

	this.goStep = function(direction) {
		// set value of new step
		if (typeof direction == "undefined") direction = "next";

		var lastStep = this.currentStep;
		
		if (direction == "next") {
			var stepTo = this.currentStep + 1;
			// conduct validation checks if advancing
			var valid = this.validateStep(this.currentStep);
			if (!valid) {
				if (this.debug) console.log('Step ' + this.currentStep + ' has validation errors');
				this.steps[this.currentStep - 1].querySelector('.error').focus(); // focus on the first field in error
				return;
			}
		} else {
			var stepTo = this.currentStep - 1;
		}
				

		if (stepTo <= 0) stepTo = 1;
		if (stepTo > this.steps.length)  {
			// submit form
			this.submitForm();
		} else {
			this.goToStep(stepTo, lastStep);
		}
	}

	this.goToStep = function(newStep, lastStep) {

		this.currentStep = newStep;

		if (this.debug) console.log('Current step: ' + newStep);

		// show step and update progress
		this.steps[lastStep - 1].style.display = 'none'
		this.steps[this.currentStep - 1].style.display = 'block';

		this.updateProgress(this.steps[this.currentStep - 1].dataset.progress);

		// move focus to first field on new step
		this.steps[this.currentStep - 1].querySelector('input, select').focus();
	}

	this.validateStep = function(step) {
		// gather all inputs in this step
		var fields = this.steps[step - 1].querySelectorAll('input:not([type="hidden"]), select, textarea');

		var stepIsValid = true;

		// validate inputs one at a time
		for (var i = 0; i < fields.length; i++) {
			var validField = this.validateInput(fields[i]);
			if (!validField) {
				stepIsValid = false;
				if (this.debug) console.log('Errors in field: ' + fields[i].name);
			}
		}

		return stepIsValid;
	}

	this.submitForm = function() {
		if (this.debug) console.log('Beginning form submission');
		var obj = this;

		// at this point everything has been validated client side
		// gather all input data into a submission string
		var data = this.serialize(this.form);
		data += "&js=true";
		if (this.debug) console.log('Serialized data: ' + data);

		// "disable" submit button
		this.form.querySelector('[data-step="' + this.currentStep + '"] .form-next button').classList.add('disabled');
		this.form.querySelector('[data-step="' + this.currentStep + '"] .form-next button').innerText = "Submitting...";
		
		// submit to back-end script
		var xhr = new XMLHttpRequest();
		xhr.open('POST', this.form.action);
		xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		xhr.onload = function() {
			if (xhr.status !== 200) {
				if (obj.debug) {
					console.log('Server error');
					console.log(xhr.responseText);
				}
				alert(xhr.responseText); // message defined in inquiry submission service

				// "re-enable" submit button
				let submitButton = obj.steps[obj.steps.length - 1].querySelector('.form-next button');
				submitButton.classList.remove('disabled');
				submitButton.innerText = obj.submitButtonText;
			} else {				
				var response = JSON.parse(xhr.responseText);
				if (obj.debug) console.log(response);

				// Push Form ID to GTM for event tracking purposes
				if (typeof dataLayer != 'undefined') {
					dataLayer.push({'inquiryFormId' : obj.form.id || null});
				}

				if (response.message == "success") {
					// if successful, perform success actions (log events, redirect, happy message, etc.)
					// Set cookies
					if (typeof Cookies != 'undefined') {
						Cookies.set('qid',response.qid);
						//Cookies.set('thanks', true);
					}

					// GTM event
					if (typeof dataLayer != 'undefined') {
						dataLayer.push({'event' : 'conversion'});
					}

					// Page redirect
					window.location = obj.submissionRedirectUrl;
				} else {
					// if errors, display them
					if (obj.debug) {
						console.log('Submission error(s)');
					}
					// visually mark error fields
					for (key in response.errors) {
						if (response.errors.hasOwnProperty(key)) {
							var field = obj.form.querySelector('[name=' + key + ']');
							var messageObj = new Object;
							messageObj.message = response.errors[key];
							obj.displayError(field, messageObj);
						}
					}
					// GTM event
					if (typeof dataLayer != 'undefined') {
						dataLayer.push({'event' : 'failed-form'});
					}

					// "re-enable" submit button
					let submitButton = obj.steps[obj.steps.length - 1].querySelector('.form-next button');
					submitButton.classList.remove('disabled');
					submitButton.innerText = obj.submitButtonText;
				}
				
			}
		}
		xhr.send(data);
		

		
	}

	this.validateInput = function(field) {
		var fieldIsValid = true;

		// determine any validation rules for this field
		var rules = this.validation[field.name];
		if (typeof rules != "undefined") {
			
			// run each validation rule
			for (var i = 0; i < rules.length; i++) {
				switch(rules[i].type) {
					case 'required':
						if (field.type == "radio") {
							if (this.form.querySelector('input[name=' + field.name + ']:checked') == null) {
								fieldIsValid = false;
							}
						} else {
							if (field.value == "") {
								fieldIsValid = false;
							}
						}
						break;
					case 'email':
						var emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
						if (field.value.match(emailRegex) == null) {
							fieldIsValid = false;
						}
						break;
					case 'phone':
						var phoneRegex = /^\D?(\d{3})\D?\D?(\d{3})\D?(\d{4})$/;
						if (field.value.match(phoneRegex) == null) {
							fieldIsValid = false;
						}
						break;
					case 'postal_code':
						var postalCodeRegex = /^[0-9]{5}(-[0-9]{4})?$/;
						if (field.value.match(postalCodeRegex) == null) {
							fieldIsValid = false;
						}
						break;
					case 'regex':
						var regex = rules.regex;
						if (field.value.match(regex) == null) {
							fieldIsValid = false;
						}
				}

				// stop loop on first error
				if (!fieldIsValid) {
					this.displayError(field, rules[i]);
					break;
				}
			}
		}

		// if field is valid, remove errors if present
		if (fieldIsValid) {
			field.classList.remove('error');
			field.removeAttribute('aria-invalid');
			field.removeAttribute('aria-describedby');
			if (field.type == "radio") {
				var siblings = this.form.querySelectorAll('input[name=' + field.name + ']');
				for (var i = 0; i < siblings.length; i++) {
					siblings[i].classList.remove('error');
					siblings[i].removeAttribute('aria-invalid');
					siblings[i].removeAttribute('aria-describedby');
				}
			}
			var errorMessageDiv = this.form.querySelector('.form-field.' + field.name + ' .form-field-error');
			if (errorMessageDiv != null) {
				errorMessageDiv.parentNode.removeChild(errorMessageDiv);
			}
		}


		// return result
		if (this.debug) {
			if (fieldIsValid) console.log(field.name + ' is valid');
			else console.log(field.name + ' is invalid!')
		}
		return fieldIsValid;
	}

	this.displayError = function(field, rule) {
		// return default message for rule type if none specified
		if (typeof rule.message == "undefined") {
			var message = this.defaultErrorMessage(rule.type);
		} else {
			// get the error message
			var message = rule.message;
		}

		field.classList.add('error');
		field.setAttribute('aria-invalid', 'true');
		field.setAttribute('aria-describedby', 'error-message' + field.name);
		
		var errorMessageDiv = this.form.querySelector('.form-field.' + field.name + ' .form-field-error');
		
		// add error message if not already present
		if (errorMessageDiv == null) {
			var fieldParent = this.form.querySelector('.form-field.' + field.name);
			var errorMessageDiv = document.createElement('div');
			errorMessageDiv.classList.add('form-field-error');
			errorMessageDiv.setAttribute('id', 'error-message-' + field.name);
			fieldParent.append(errorMessageDiv);
		}
		
		errorMessageDiv.innerText = message;
		
		if (this.debug) console.log('Error: ' + field.name + ' - ' + message);
	}

	this.defaultErrorMessage = function(ruleType) {
		switch(ruleType) {
			case 'required':
				return "Required field";
				break;
			case 'email':
				return "Invalid email address";
				break;
			case 'phone':
				return "Invalid phone number";
				break;
			case 'postal_code':
				return "Invalid postal code";
				break;
			default:
				return "Invalid entry";
				break;
		}
	}

	this.prepopulate = function(fieldsArray) {
		if (!(typeof fieldsArray == "object" && fieldsArray.length > 0)) return;

		// go through the provided array and prepopulate any fields possible
		for (var i = 0; i < fieldsArray.length; i++) {
			var field = this.form.querySelector('[name="' + fieldsArray[i].name + '"]');
			if (field != null) {
				switch (field.type) {
					case 'radio':
						// get all radios by that name
						var radioFields = this.form.querySelectorAll('[name="' + fieldsArray[i].name + '"]');
						// if this radio input's value matches, check it
						for (var j = 0; j < radioFields.length; j++) {
							radioFields[j].checked = (radioFields[j].value == fieldsArray[i].value);
						}
						break;
					case 'checkbox':
						field.checked = fieldsArray[i].value;
						break;
					default:
						field.value = fieldsArray[i].value;
						break;
				}
			}
		}

		// advance to the last step that has empty fields
		var stepTo = 0;

		for (var i = 0; i < this.steps.length; i++) {
			var stepTo = i;
			var stepComplete = true; //set to false when we find the first error

			var fields = this.steps[i].querySelectorAll('input, select');
			for (var j = 0; j < fields.length; j++) {
				switch (fields[j].type) {
					case 'radio':
						// get all radios by that name
						var radioFields = this.form.querySelectorAll('[name="' + fieldsArray[i].name + '"]');
						// if one is checked, we're good
						var fieldOk = false;
						for (var j = 0; j < radioFields.length; j++) {
							if (radioFields[j].checked == true) {
								fieldOk = true;
								break;
							}
						}
						if (!fieldOk) stepComplete = false;
						break;
					case 'checkbox':
						if (fields[j].checked == false) stepComplete = false;
						break;
					default:
						if (fields[j].value == "") {
							if (this.debug) console.log(fields[j].name + ' is empty');
							stepComplete = false;
						}
						break;
				}
				if (!stepComplete) break;
			}

			if (!stepComplete) {
				if (this.debug) console.log('Step ' + (stepTo+1) + ' is incomplete');
				break;
			}
		}

		this.goToStep(stepTo + 1, this.currentStep);
	}

	/**
	 * Shamelessly ripped off Stack Overflow https://stackoverflow.com/a/30153391
	 * Mimics jQuery's $.serialize() method
	 */
	this.serialize = function(form) {
	    var field, s = [];
	    if (typeof form == 'object' && form.nodeName == "FORM") {
	        var len = form.elements.length;
	        for (i=0; i<len; i++) {
	            field = form.elements[i];
	            if (field.name && !field.disabled && field.type != 'file' && field.type != 'reset' && field.type != 'submit' && field.type != 'button') {
	                if (field.type == 'select-multiple') {
	                    for (j=form.elements[i].options.length-1; j>=0; j--) {
	                        if(field.options[j].selected)
	                            s[s.length] = encodeURIComponent(field.name) + "=" + encodeURIComponent(field.options[j].value);
	                    }
	                } else if ((field.type != 'checkbox' && field.type != 'radio') || field.checked) {
	                    s[s.length] = encodeURIComponent(field.name) + "=" + encodeURIComponent(field.value);
	                }
	            }
	        }
	    }
	    return s.join('&').replace(/%20/g, '+');
	}

}