'use strict';

window.addEventListener('DOMContentLoaded', function (e) {
    var currentPath = window.location.pathname.replace(/.*_site/, ""); // in case of location, just taking out anything irrelevant

    // Get all valid banners for this URL
    var validBanners = [];
    siteBanners.forEach(function (banner) {
        // Skip if this page is excluded
        if (banner.exclude && banner.exclude.indexOf(currentPath) > -1) {
            return;
        }

        if (banner.include && banner.include.indexOf(currentPath) > -1 || banner['default'] || !banner.include) {

            // Date range check
            if (banner.dates) {
                if (banner.dates.start) {
                    var startDate = banner.dates.start.split('/');
                    startDate = new Date(startDate[2], startDate[0] - 1, startDate[1]);
                    if (startDate > Date.now()) return;
                }
                if (banner.dates.end) {
                    var endDate = banner.dates.end.split('/');
                    endDate = new Date(endDate[2], endDate[0] - 1, endDate[1]);
                    if (endDate < Date.now()) return;
                }
            }
            validBanners.push(banner);
        }
    });

    //console.log(validBanners)

    // If there are multiple that apply, let's show them in reverse order
    // (ie. latest additions first, presumably default shows last)

    if (validBanners.length > 1) validBanners.reverse();

    // If they've not previously hidden this banner, show it
    for (var i = 0; i < validBanners.length; i++) {
        var banner = validBanners[i];
        if (banner.id && typeof Cookies.getJSON('hidebanners') != "undefined" && Cookies.getJSON('hidebanners').indexOf(banner.id) > -1) {
            continue;
        }

        showBanner(banner);

        break;
    }

    function showBanner(banner) {
        //console.log('The banner you will be shown is:',banner)

        // find the right template
        var bannerContent = document.querySelector('template[data-type="' + banner.type + '"]').content.cloneNode(true);

        // replace any placeholder text
        if (banner.link) {
            var linkTag = bannerContent.querySelector('a[data-link]');
            if (linkTag) {
                linkTag.setAttribute('href', linkTag.getAttribute('href').replace('[link]', banner.link));
            }
        }
        if (banner.content) {
            for (var property in banner.content) {
                var tagToReplace = bannerContent.querySelector('[data-content-' + property + ']');
                if (tagToReplace) {
                    tagToReplace.innerHTML = tagToReplace.innerHTML.replace('[content.' + property + ']', banner.content[property]);
                }
            }
        }

        // insert into placeholder
        var alertBanner = document.querySelector('#alert-banner');
        alertBanner.appendChild(bannerContent);
        alertBanner.setAttribute('data-alert-id', banner.id);

        /**
         * Intersection observer for triggering the start date banner
         */
        var avoidEls = document.querySelectorAll('.helixform');
        var observer = new IntersectionObserver(function (entries, observer) {
            var avoidElsIntersecting = false;
            entries.forEach(function (entry) {
                //console.log(entry);
                if (entry.intersectionRatio > 0) avoidElsIntersecting = true;
            });
            if (avoidElsIntersecting) {
                alertBanner.classList.add('hidden');
            } else {
                alertBanner.classList.remove('hidden');
            }
        });
        avoidEls.forEach(function (el) {
            observer.observe(el);
        });
    }

    // Click listener for alert banner links (including close)
    var alertBanner = document.querySelector('#alert-banner');
    alertBanner.addEventListener('click', function (e) {
        e.preventDefault();

        // Click on the close link
        if (e.target.tagName == "A" && e.target.classList.contains('close')) {
            alertBanner.remove();
            if (typeof dataLayer != "undefined") dataLayer.push({ 'event': 'start-banner', 'action': 'close' });

            var alertId = alertBanner.dataset.alertId;
            var hiddenBanners = Cookies.getJSON('hidebanners');
            if (typeof hiddenBanners != "undefined") {
                hiddenBanners.push(alertId);
                Cookies.set('hidebanners', hiddenBanners);
            } else {
                Cookies.set('hidebanners', '["' + alertId + '"]');
            }
        } else if (e.target.tagName == "A" && e.target.classList.contains('call')) {
            if (typeof dataLayer != "undefined") dataLayer.push({ 'event': 'start-banner', 'action': 'call' });
            window.location = e.target.href;
        } else if (e.target.tagName == "A") {
            if (typeof dataLayer != "undefined") dataLayer.push({ 'event': 'start-banner', 'action': e.target.dataset.action || 'click' });
            window.location = e.target.href;
        }
    });
});

var siteBanners = [{ "id": "ht-start-date", "type": "start-date", "default": true, "exclude": ["/apply/", "/thank-you/"] }, { "id": "mba-message-fall-2020", "type": "message", "content": { "message": "Get the $100 application fee waived if you apply NOW for our MBA! Apply for FREE. &rarr;" }, "link": "/apply/", "include": ["/mba/"], "dates": { "start": "9/30/2020", "end": "10/13/2020" } }, { "id": "apply-message-fall-2020", "type": "message", "content": { "message": "We’re now waiving our application fee for new HT students! Apply for FREE. &rarr;" }, "exclude": ["/mba/", "/apply/", "/thank-you/"], "link": "/apply/", "dates": { "start": "9/30/2020", "end": "10/21/2020" } }, { "id": "webinar-mba-10272020", "type": "webinar", "content": { "title": "MBA Info Session on 10/27", "description": "Everything you need to know about HT’s MBA." }, "dates": { "start": "10/13/2020", "end": "10/28/2020" }, "link": "/webinar-mba/", "include": ["/mba/"] }, { "id": "apply-message-nov-2020", "type": "message", "content": { "message": "New undergraduate HT students apply for free! Click here to get your application fee waived. &rarr;" }, "link": "/apply/", "dates": { "start": "11/4/2020", "end": "1/7/2020" }, "exclude": ["/apply/", "/thank-you/", "/mba/", "/mba-2/"] }, { "id": "webinar-info-03232021", "type": "webinar", "content": { "title": "Sign up for our FREE Adult Degree Program Information Session on 3/23.", "description": "" }, "dates": { "end": "3/24/2021" }, "link": "/info/", "exclude": ["/apply/", "/thank-you/"] }];