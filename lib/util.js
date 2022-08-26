'use strict';

const convertValueFromEnvironment = function (value) {
    if (value) {
        return value.replace(/(\{(\{[\w\d]+\})\})/g, '$$$2')
    }
    return '';
}

module.exports = convertValueFromEnvironment;