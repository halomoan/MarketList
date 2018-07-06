sap.ui.define([
		"sap/ui/core/format/DateFormat"
	], function (DateFormat) {
		"use strict";

		return {
			/**
			 * Rounds the currency value to 2 digits
			 *
			 * @public
			 * @param {string} sValue value to be formatted
			 * @returns {string} formatted currency value with 2 digits
			 */
			currencyValue : function (sValue) {
				if (!sValue) {
					return "0.00";
				}

				return parseFloat(sValue).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');
			},
			
			dateFormat : function(value) {
				var d = new Date(value);
				var dFormat = DateFormat.getDateTimeInstance({pattern: "dd/MMM/YYYY"});
				return dFormat.format(d);
			},
			dayFormat: function(value) {
				var d = new Date(value);
				var sDay =  this.getResourceBundle().getText("day" + d.getDay());
				return sDay;
			}
			
		};

	}
);