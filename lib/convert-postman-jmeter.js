'use strict';

const contains = require('string-contains');
const path = require('path');
const fs = require('fs');
const RequestObject = require('./request-object');
const TemplateJmeter = require('./template-jmeter');
const convertValueFromEnvironment = require('./util');


/**
 * Load file project Postman to convert JMeter
 * @param {*} projectPostman
 * @return {boolean} true only loaded success.
 */
function loadFileProject(projectPostman) {
  try {
    const fileContents = fs.readFileSync(projectPostman, 'utf8');

    try {
      let dataPostman = JSON.parse(fileContents);
      return dataPostman;
    } catch (err) {
      console.error('Error parsing json file', err);
    }
  } catch (err) {
    console.log('Error loading file', err);
  }

  return {};
}

function parseItem(item, requestCollection) {
  if (item !== undefined & item.request !== undefined && item.request.url !== null) {
    const urlItem = item.request.url;
    let bodyData = '';

    if (item.request.body !== undefined) {
      bodyData = convertValueFromEnvironment(item.request.body.raw);
    }

    const request = new RequestObject(
      item.name,
      urlItem.protocol,
      urlItem.host.join('.'),
      '',
      urlItem.path.join('/'),
      item.request.method,
      bodyData,
    );

    if (item.request.header !== undefined) {
      item.request.header.forEach(function(headerItem) {
        request.addHeaderCollection(headerItem.key, headerItem.value);
      });
    }

    requestCollection.push(request);
  } else {
    console.log('Request with data incomplete');
  }
}

function parseItemInItem(item, requestCollection) {
  item.forEach(m => parseItem(m, requestCollection))
}

function parseEnvironment(projectPostmanEnvironment) {
  try {
    const envPostman = loadFileProject(projectPostmanEnvironment);
    const env = {};

    envPostman.values.forEach(v => {
      if (!v.enabled) {
        return;
      }
      env[v.key] = v.value;
    });

    return env;
  } catch (err) {
    return {};
  }
}

/**
 * Export individual project postman
 * @param {string} projectPostman Path project postman.
 * @param {string} projectJmeter Name project out JMeter.
 * @param {boolean} override Flag is override.
 * @return {boolean} Is success.
 */
function exportByProject(projectPostman, projectPostmanEnvironment, projectJmeter, override) {
  console.log('Read file:', path.resolve(projectPostman));
  if (!projectJmeter) {
    projectJmeter = projectPostman.toString().replace('.json', '.jmx');
    console.log('Export to file:', projectJmeter);
  } else {
    console.log('Export to file:', path.dirname(projectJmeter).split(path.sep).pop());
  }

  if (fs.existsSync(projectPostman)) {
    const dataPostman = loadFileProject(projectPostman);
    const envPostman = parseEnvironment(projectPostmanEnvironment);
    const requestCollection = [];

    if (dataPostman.info.schema.indexOf('v2.1.0')) {
      dataPostman.item.forEach(item => parseItemInItem(item.item, requestCollection));
    } else {
      dataPostman.item.forEach(item => parseItem(item.item, requestCollection));
    }

    const templateJmeter = new TemplateJmeter();
    const projectContentFile = templateJmeter.engineJmeterProject(
      requestCollection,
    );

    if (fs.existsSync(projectJmeter) && override === false) {
      console.error(
        'File project destination exists: ',
        path.resolve(projectJmeter),
      );
    } else {
      fs.writeFile(projectJmeter, projectContentFile, function(err) {
        if (err) throw err;
        console.log('File is created successfully: ', projectJmeter);
      });
    }
    return true;

  }
  return false;
}

/**
 * Configure converter
 * @param {*} options
 * @return {boolean} true only converted success.
 */
function convertProject(options) {
  console.log('Starting convert...');

  let isParsed = false;
  if (options === undefined) {
    console.error('Options is undefined');
  } else {
    const projectPostman = options.projectPostman || '';
    const projectPostmanEnvironment = options.projectPostmanEnvironment || '';
    const projectJmeter = options.projectJmeter || '';
    const override = options.override || false;
    const batchFolder = options.batchFolder || '';

    if (batchFolder !== '') {
      console.log('Export by batch project');

      fs.readdirSync(batchFolder).forEach((file) => {
        if (fs.lstatSync(path.resolve(batchFolder, file)).isFile()) {
          if (contains(file, '.postman_collection.json')) {
            const projectJmeterGenerated = path.resolve(batchFolder, file.replace('.json', '.jmx'));
            const projectPostman = path.resolve(batchFolder, file);
            console.log('File project: ' + projectPostman);
            exportByProject(projectPostman, projectJmeterGenerated, true);
          }
        }
      });
      isParsed = true;
    } else {
      console.log('Export individual project');
      if (projectPostman !== '') {
        isParsed = exportByProject(projectPostman, projectPostmanEnvironment, projectJmeter, override);
      }
    }
  }
  return isParsed;
}

module.exports.convert = convertProject;
