import NDTmeter from './ndt-d3.js';
import NDTjs from './ndt-browser-client.js';

const survey = document.getElementById('Consent');

if (!!survey) {
  survey.addEventListener('submit', checkLocationConsent);
}

let ndtServer,
	ndtServerIp,
	ndtPort = "3010",
	ndtProtocol = 'wss',
	ndtPath = "/ndt_protocol",
	ndtUpdateInterval = 1000,
	c2sRate,
	s2cRate,
	MinRTT;

getNdtServer()

const NDT_meter = new NDTmeter('#SubmitSurvey');

function checkLocationConsent () {
  event.preventDefault();

  const useLocation = document.getElementById('yes').checked;

  console.log(useLocation);

  if (!!useLocation) {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(success, error);
    }
  } else { runTests(); }
}

function runTests(event) {
  const NDT_client = new NDTjs(ndtServer, ndtPort, ndtProtocol, ndtPath, NDT_meter, ndtUpdateInterval);

  NDT_client.startTest();
};

function success(position) {
  const NDT_client = new NDTjs(ndtServer, ndtPort, ndtProtocol, ndtPath, NDT_meter, ndtUpdateInterval);

	document.getElementById('latitude').value = position.coords.latitude;
	document.getElementById('longitude').value = position.coords.longitude;

	var xhr = new XMLHttpRequest(),
	currentLocationURL = "https://nominatim.openstreetmap.org/reverse?format=json&lat=" + position.coords.latitude + "&lon=" + position.coords.longitude + "&zoom=18&addressdetails=1";

	var currentLoc;
	xhr.open('GET', currentLocationURL, true);
	xhr.send();
	xhr.onreadystatechange = function () {
		if (xhr.readyState === 4) {
			if (xhr.status === 200) {
				currentLoc = JSON.parse(xhr.responseText);
				console.log("Location received");
        NDT_client.startTest();
				// currentLocText.text(currentLoc.address.road + currentLoc.address.neighbourhood + currentLoc.address.suburb + currentLoc.address.city + currentLoc.address.state);
				document.getElementsByClassName('loader-content')[0].append("Searching from: " + currentLoc.address.road + ", " + currentLoc.address.city + ", " + currentLoc.address.state);
			} else {
				console.log('Location lookup failed');
			}
		}
	};
}

function error(error) {
	document.getElementById('ErrorMessage').innerHTML = 'ERROR(' + error.code + '): ' + error.message;
}

function getNdtServer() {
	var xhr = new XMLHttpRequest(),
		mlabNsUrl = 'https://mlab-ns.appspot.com/ndt_ssl?format=json';

	xhr.open('GET', mlabNsUrl, true);
	xhr.send();
	xhr.onreadystatechange = function () {
		if (xhr.readyState === 4) {
			if (xhr.status === 200) {
				ndtServer = JSON.parse(xhr.responseText).fqdn;
				ndtServerIp = JSON.parse(xhr.responseText).ip;
				console.log('Using M-Lab Server ' + ndtServer);
			} else {
				console.log('M-Lab NS lookup failed.');
			}
		}
	};
};
