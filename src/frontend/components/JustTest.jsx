// base imports
import React from 'react';
import PropTypes from 'prop-types';

// Bootstrap imports
import Container from 'react-bootstrap/Container';

// module imports
import NdtWidget from './utils/NdtWidget.jsx';

export default function Survey(props) {
  const settings = props.location.state.settings;
  const locationConsent = props.location.state.locationConsent;
  const latitude = props.location.state.latitude;
  const longitude = props.location.state.longitude;
  const address = props.location.state.address;
  const surveyId = props.location.state.surveyId;
  const sessionId = props.location.state.sessionId;

  const onFinish = async (finished, results, location) => {
    console.log('Test complete:', finished);
    console.log('Location:', location);
    return fetch(
      `https://${
        settings.qualtricsEnv
      }.qualtrics.com/API/v3/surveys/${surveyId}/sessions/${sessionId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-TOKEN': settings.qualtricsApiToken,
        },
        body: {
          advance: false,
          embeddedData: {
            c2sRate: results.c2sRate,
            s2cRate: results.s2cRate,
            MinRTT: results.MinRTT,
            MaxRTT: results.MaxRTT,
            latitude: latitude,
            longitude: longitude,
            address: address,
            ClientIP: results.ClientIP,
            FullResults: JSON.stringify(results),
          },
        },
      },
    ).then(response => {
      if (response.ok) {
        return history.push({
          pathname: '/continue',
          state: {
            results: results,
            settings: settings,
          },
        });
      }
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    });
  };

  return (
    <Container className={'mt-4'}>
      <style type="text/css">
        {`
            h1, h2, h3 {
              color: ${settings.color_one};
            }
            .form-group a {
              color: ${settings.color_two};
            }
            .form-group a:active, .form-group a:focus, .form-group a:hover {
              color: filter: brightness(75%) !important;
            }
            .btn-toolbar input {
              background-color: ${settings.color_two};
              border: 2px solid ${settings.color_two};
              color: #fff;
              cursor: pointer;
            }
            .btn-toolbar input.disabled {
              background-color: filter(50%);
              border: 2px solid #ccc;
              color: #ccc;
              cursor: not-allowed;
            }
          `}
      </style>
      <NdtWidget onFinish={onFinish} locationConsent={locationConsent} />
    </Container>
  );
}

Survey.propTypes = {
  location: PropTypes.shape({
    state: PropTypes.shape({
      settings: PropTypes.object.isRequired,
      locationConsent: PropTypes.bool.isRequired,
      latitude: PropTypes.string.isRequired,
      longitude: PropTypes.string.isRequired,
      address: PropTypes.string.isRequired,
      surveyId: PropTypes.string.isRequired,
      sessionId: PropTypes.string.isRequired,
    }),
  }),
};
