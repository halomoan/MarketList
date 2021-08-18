sap.ui.define([
	"sap/ui/demo/masterdetail/controller/BaseController",
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator'
], function(BaseController,Filter,FilterOperator) {
	"use strict";

	return BaseController.extend("sap.ui.demo.masterdetail.pages.controller.ManageTemplate", {

	
		onInit: function() {
			this.getRouter().getRoute("managetemplate").attachPatternMatched(this._onRouteMatched, this);
		},

		_onRouteMatched: function(oEvent){
			this.plantID = oEvent.getParameter("arguments").plantId;
			this.CostCenterID = oEvent.getParameter("arguments").ccId;
			
			var PRID = this.plantID + this.CostCenterID.substring(this.CostCenterID.length - 6, this.CostCenterID.length );
			
			this.oFilterPlant = new Filter("PlantID", FilterOperator.EQ, this.plantID); // Filter Plant
			this.oFilterTmplID = new Filter("PRID", FilterOperator.EQ, PRID); // Filter TemplateID
			
			this._refreshTable();
			
		},
		
		_refreshTable: function(){
			var oTable = this.byId("tmpltbl");
			var oBinding = oTable.getBinding("rows");
			
			if (oBinding) {
				oBinding.filter([this.oFilterPlant,this.oFilterTmplID],sap.ui.model.FilterType.Application);
			}
		},
		
		onExit: function() {
	
		}

	});

});