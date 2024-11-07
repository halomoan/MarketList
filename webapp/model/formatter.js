sap.ui.define([
		"sap/ui/core/format/DateFormat",
		 "sap/ui/core/format/NumberFormat"
	], function (DateFormat,NumberFormat) {
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
				// if (!sValue) {
				// 	return "0.00";
				// }
				// return parseFloat(sValue).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,');	
				var oCurrencyFormat = NumberFormat.getCurrencyInstance();
				var value = oCurrencyFormat.format(sValue,"$ ");
				return value;
				
			},
			
			dateFormat : function(value) {
				var d = new Date(value);
				var dFormat = DateFormat.getDateTimeInstance({pattern: "dd/MMM/yyyy"});
				return dFormat.format(d);
			},
			dayFormat: function(value) {
				var d = new Date(value);
				var sDay =  this.getResourceBundle().getText("day" + d.getDay());
				return sDay;
			},
			YYYYMMDD : function(value) {
				var d = new Date(value);
				var dFormat = DateFormat.getDateTimeInstance({pattern: "yyyy-MM-dd"});
				return dFormat.format(d);
			},
			
		};

	}
);