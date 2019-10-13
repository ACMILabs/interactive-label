/**
 * Class grouping together all methods to render a playlist in the client.
 */
export default class PlaylistRenderer {
    /**
     * Set an initial state for the renderer
     */
    constructor() {
      this.state = {
        playlistJson: null
      };
    }
  
    /**
     * Init, parsing playlist id that should be made available on the
     * rendered page via window.playlistData.
     */
    init() {
      const id =
        'id' in window.playlistData ? window.playlistData.id : null;

      if (id != null) {
        const url = `/api/playlist_json/`;
        this.fetchPlaylist(url);
      } else {
        console.error('No valid id could be found on initial pageload.'); // eslint-disable-line no-console
      }
    }
  
    /**
     * Fetch playlist makes API request to get playlist data.
     * @param {string} url - The playlist API
     */
    fetchPlaylist(url) {
      fetch(url)
        .then(response => {
          if (!response.ok) {
            throw Error(response.statusText);
          }
          return response.json();
        })
        .then(jsonData => {
          this.state.playlistJson = jsonData;
        })
        .catch(error => console.error(error)); // eslint-disable-line no-console
    }
  }
  
  /**
   * Init the PlaylistRenderer app once the DOM has completed loading.
   */
  document.addEventListener('DOMContentLoaded', () => {
    if (window.playlistData) {
      const playlistApp = new PlaylistRenderer();
      playlistApp.init();
    } else {
      console.error('No playlist data could be found on initial pageload.'); // eslint-disable-line no-console
    }
  });
  