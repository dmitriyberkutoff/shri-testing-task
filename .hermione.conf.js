module.exports = {
  sets: {
    desktop: {
      files: ["test/hermione/common*"],
      browsers: ['chromeDesktop'],
    }
  },

  browsers: {
    chromeDesktop: {
      automationProtocol: "devtools",
      retry: 3,
      screenshotDelay: 1000,
      desiredCapabilities: {
        browserName: "chrome",
      },
      windowSize: {
        width: 1920,
        height: 1080
      }
    },
  },

  plugins: {
    "html-reporter/hermione": {
      enabled: true,
    },
  },
};
