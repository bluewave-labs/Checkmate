const axios = require("axios");
const ping = require("ping");
const logger = require("../utils/logger");

class NetworkService {
  constructor(db, emailService) {
    this.db = db;
    this.emailService = emailService;
    this.TYPE_PING = "ping";
    this.TYPE_HTTP = "http";
    this.TYPE_PAGESPEED = "pagespeed";
    this.SERVICE_NAME = "NetworkService";
    this.NETWORK_ERROR = 5000;
  }

  async handleNotification(job, isAlive) {
    const { _id } = job.data;
    const monitor = await this.db.getMonitorById(_id);

    // If monitor status changes, update monitor status and send notification
    if (monitor.status !== isAlive) {
      monitor.status = !monitor.status;
      await monitor.save();

      let template =
        isAlive === true ? "serverIsUpTemplate" : "serverIsDownTemplate";
      let status = isAlive === true ? "up" : "down";

      const notifications = await this.db.getNotificationsByMonitorId(_id);
      for (const notification of notifications) {
        if (notification.type === "email") {
          await this.emailService.buildAndSendEmail(
            template,
            { monitorName: monitor.name, monitorUrl: monitor.url },
            notification.address,
            `Monitor ${monitor.name} is ${status}`
          );
        }
      }
    }
  }

  /**
   * Measures the response time of an asynchronous operation.
   * @param {Function} operation - An asynchronous operation to measure.
   * @returns {Promise<{responseTime: number, response: any}>} An object containing the response time in milliseconds and the response from the operation.
   * @throws {Error} The error object from the operation, contains response time.
   */
  async measureResponseTime(operation) {
    const startTime = Date.now();
    try {
      const response = await operation();
      const endTime = Date.now();
      return { responseTime: endTime - startTime, response };
    } catch (error) {
      const endTime = Date.now();
      error.responseTime = endTime - startTime;
      throw error;
    }
  }

  /**
   * Handles the ping operation for a given job, measures its response time, and logs the result.
   * @param {Object} job - The job object containing data for the ping operation.
   * @returns {Promise<{boolean}} The result of logging and storing the check
   */
  async handlePing(job) {
    const operation = async () => {
      const response = await ping.promise.probe(job.data.url);
      return response;
    };

    let isAlive;

    try {
      const { responseTime, response } =
        await this.measureResponseTime(operation);
      isAlive = response.alive;

      const checkData = {
        monitorId: job.data._id,
        status: isAlive,
        responseTime,
      };
      return await this.logAndStoreCheck(checkData, this.db.createCheck);
    } catch (error) {
      isAlive = false;
      const checkData = {
        monitorId: job.data._id,
        status: isAlive,
        responseTime: error.responseTime,
      };
      return await this.logAndStoreCheck(checkData, this.db.createCheck);
    } finally {
      this.handleNotification(job, isAlive);
    }
  }

  /**
   * Handles the http operation for a given job, measures its response time, and logs the result.
   * @param {Object} job - The job object containing data for the ping operation.
   * @returns {Promise<{boolean}} The result of logging and storing the check
   */
  async handleHttp(job) {
    // Define operation for timing
    const operation = async () => {
      const response = await axios.get(job.data.url);
      return response;
    };

    let isAlive;

    // attempt connection
    try {
      const { responseTime, response } =
        await this.measureResponseTime(operation);

      // check if response is in the 200 range, if so, service is up
      isAlive = response.status >= 200 && response.status < 300;

      //Create a check with relevant data
      const checkData = {
        monitorId: job.data._id,
        status: isAlive,
        responseTime,
        statusCode: response.status,
      };
      return await this.logAndStoreCheck(checkData, this.db.createCheck);
    } catch (error) {
      isAlive = false;
      const checkData = {
        monitorId: job.data._id,
        status: isAlive,
        responseTime: error.responseTime,
      };
      // The server returned a response
      if (error.response) {
        checkData.statusCode = error.response.status;
      } else {
        checkData.statusCode = this.NETWORK_ERROR;
      }
      return await this.logAndStoreCheck(checkData, this.db.createCheck);
    } finally {
      this.handleNotification(job, isAlive);
    }
  }

  /**
   * Handles PageSpeed job types by fetching and processing PageSpeed insights.
   *
   * This method sends a request to the Google PageSpeed Insights API to get performance metrics
   * for the specified URL, then logs and stores the check results.
   *
   * @param {Object} job - The job object containing data related to the PageSpeed check.
   * @param {string} job.data.url - The URL to be analyzed by the PageSpeed Insights API.
   * @param {string} job.data._id - The unique identifier for the monitor associated with the check.
   *
   * @returns {Promise<void>} A promise that resolves when the check results have been logged and stored.
   *
   * @throws {Error} Throws an error if there is an issue with fetching or processing the PageSpeed insights.
   */
  async handlePagespeed(job) {
    let isAlive;

    try {
      const url = job.data.url;
      const response = await axios.get(
        `https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed?url=${url}&category=seo&category=accessibility&category=best-practices&category=performance`
      );
      const pageSpeedResults = response.data;
      const categories = pageSpeedResults.lighthouseResult?.categories;
      const audits = pageSpeedResults.lighthouseResult?.audits;
      const {
        "cumulative-layout-shift": cls,
        "speed-index": si,
        "first-contentful-paint": fcp,
        "largest-contentful-paint": lcp,
        "total-blocking-time": tbt,
      } = audits;

      // Weights
      // First Contentful Paint	10%
      // Speed Index	10%
      // Largest Contentful Paint	25%
      // Total Blocking Time	30%
      // Cumulative Layout Shift	25%

      isAlive = true;
      const checkData = {
        monitorId: job.data._id,
        status: isAlive,
        accessibility: (categories.accessibility?.score || 0) * 100,
        bestPractices: (categories["best-practices"]?.score || 0) * 100,
        seo: (categories.seo?.score || 0) * 100,
        performance: (categories.performance?.score || 0) * 100,
        audits: {
          cls,
          si,
          fcp,
          lcp,
          tbt,
        },
      };

      this.logAndStoreCheck(checkData, this.db.createPageSpeedCheck);
    } catch (error) {
      isAlive = false;
      const checkData = {
        monitorId: job.data._id,
        status: isAlive,
        accessibility: 0,
        bestPractices: 0,
        seo: 0,
        performance: 0,
      };
      this.logAndStoreCheck(checkData, this.db.createPageSpeedCheck);
    } finally {
      this.handleNotification(job, isAlive);
    }
  }

  /**
   * Retrieves the status of a given job based on its type.
   * For unsupported job types, it logs an error and returns false.
   *
   * @param {Object} job - The job object containing data necessary for processing.
   * @returns {Promise<boolean>} The status of the job if it is supported and processed successfully, otherwise false.
   */
  async getStatus(job) {
    switch (job.data.type) {
      case this.TYPE_PING:
        return await this.handlePing(job);
      case this.TYPE_HTTP:
        return await this.handleHttp(job);
      case this.TYPE_PAGESPEED:
        return await this.handlePagespeed(job);
      default:
        logger.error(`Unsupported type: ${job.data.type}`, {
          service: this.SERVICE_NAME,
          jobId: job.id,
        });
        return false;
    }
  }

  /**
   * Logs and stores the result of a check for a specific job.
   *
   * @param {Object} data - Data to be written
   * @param {function} writeToDB - DB write method
   *
   * @returns {Promise<boolean>} The status of the inserted check if successful, otherwise false.
   */

  async logAndStoreCheck(data, writeToDB) {
    try {
      const insertedCheck = await writeToDB(data);
      return insertedCheck.status;
    } catch (error) {
      console.log(error);
      logger.error(`Error wrtiting check for ${data.monitorId}`, {
        service: this.SERVICE_NAME,
        monitorId: data.monitorId,
        error: error,
      });
    }
  }
}

module.exports = NetworkService;
