/**
 * Class grouping together all methods to render a label in the client.
 */
export default class LabelRenderer {
    /**
     * Set an initial state for the renderer
     */
    constructor() {
      this.state = {
        labelJson: null
      };
    }
  
    /**
     * Init, parsing label id that should be made available on the
     * rendered page via window.labelData.
     */
    init() {
      const id =
        'id' in window.labelData ? window.labelData.id : null;

      if (id != null) {
        const url = `/json`;
        this.fetchLabel(url);
      } else {
        console.error('No valid id could be found on initial pageload.'); // eslint-disable-line no-console
      }
    }
  
    /**
     * Fetch playlist makes API request to get playlist data.
     * @param {string} url - The label API
     */
    fetchLabel(url) {
      fetch(url)
        .then(response => {
          if (!response.ok) {
            throw Error(response.statusText);
          }
          return response.json();
        })
        .then(jsonData => {
          this.state.labelJson = jsonData;
        })
        .catch(error => console.error(error)); // eslint-disable-line no-console
    }
  
    /**
     * Subscribe to the media player messages
     */
    subscribeToMediaPlayer() {
      // Subscribe to the media player messages
      // TODO: get media_player id from XOS
      const client = new Paho.MQTT.Client( // eslint-disable-line no-undef
        window.labelData.mqtt_host,
        parseInt(window.labelData.mqtt_port, 10),
        '/ws',
        ''
      );
  
      // set callback handlers
      client.onConnectionLost = this.onConnectionLost.bind(this);
      client.onMessageArrived = this.onMessageArrived.bind(this);
      client.connect({
        userName: window.labelData.mqtt_username,
        password: window.labelData.mqtt_password,
        onSuccess: () => {
          // Subscribe to the media player AMQP feed
          // TODO: Get the media player ID from XOS
          client.subscribe('mediaplayer.' + window.labelData.xos_media_player_id);
        }
      });
    }
  
    onConnectionLost(responseObject) {
      if (responseObject.errorCode !== 0) {
        console.error(`MQTT connection lost: ${responseObject.errorMessage}`); // eslint-disable-line no-console
        // Re-subscribe
        this.subscribeToMediaPlayer();
      }
    }
  
    onMessageArrived(message) {
      // Check to see if the currently playing label is the same as the currently displayed label
      const messageJson = JSON.parse(message.payloadString);
      if (messageJson.label_id !== this.state.currentLabelId) {
        // Update the current state
        this.state.currentLabelId = messageJson.label_id;
        const labels = this.state.labelJson.playlist_labels;
        for (let index = 0; index < labels.length; index++) {
          const element = labels[index];
          if (element.label.id === this.state.currentLabelId) {
            this.state.nextLabelId = labels[(index + 1) % labels.length].label.id;
  
            // Update the label fields with the currently playing data
            const mainElem = document.getElementById('playlist-label-js-hook');
            mainElem.getElementsByTagName('h1')[0].textContent =
              element.label.title;
            mainElem.getElementsByTagName('h2')[0].textContent =
              element.label.publication;
            mainElem.getElementsByTagName('p')[0].textContent = this.truncate(
              element.label.description,
              400
            );
            mainElem.getElementsByTagName('img')[0].src =
              element.label.works[0].image;
            mainElem.getElementsByTagName('img')[0].alt = element.label.title;
            mainElem.getElementsByTagName('img')[0].title = element.label.title;
  
            // Update up next label
            const elementNext = labels.find(label => {
              return label.label.id === this.state.nextLabelId;
            });
            mainElem.getElementsByTagName('h4')[0].textContent =
              elementNext.label.title;
            mainElem.getElementsByTagName('h5')[0].textContent =
              elementNext.label.publication;
          }
        }
      }
    }
  
    truncate(str, max) {
      return str.length > max ? `${str.substr(0, max - 3)}...` : str;
    }
  }
  
  /**
   * Init the LabelRenderer app once the DOM has completed loading.
   */
  document.addEventListener('DOMContentLoaded', () => {
    if (window.labelData) {
      const labelApp = new LabelRenderer();
      labelApp.init();
    } else {
      console.error('No label data could be found on initial pageload.'); // eslint-disable-line no-console
    }
  });
  