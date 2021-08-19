sap.ui.define([
	"sap/ui/demo/masterdetail/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator'
], function(BaseController, JSONModel, Filter, FilterOperator) {
	"use strict";

	return BaseController.extend("sap.ui.demo.masterdetail.pages.controller.ManageTemplate", {

		onInit: function() {
			var oViewData = {
				calbusy: false,
				calbusyindicator: 0

			};
			var oViewModel = new JSONModel(oViewData);
			this.setModel(oViewModel, "detailView");

			this.getRouter().getRoute("managetemplate").attachPatternMatched(this._onRouteMatched, this);
		},

		onDelete: function(oEvent) {

			sap.m.MessageBox.confirm(this.getResourceBundle().getText("msgConfirmDelMaterial"), {
				icon: sap.m.MessageBox.Icon.INFORMATION,
				title: this.getResourceBundle().getText("confirm"),
				actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
				onClose: function(oAction) {
					if (oAction === sap.m.MessageBox.Action.YES) {

						this._onDelete();

					}
				}.bind(this)
			});

		},
		
		_onDelete: function() {
			var oTable = this.byId("tmpltbl");
			var aIndices = oTable.getSelectedIndices();

			if (aIndices.length < 1) {
				sap.m.MessageToast.show(this.getResourceBundle().getText("msgNoSelected"));
			} else {

				var aMatnr = [];
				for (var i = 0; i < aIndices.length; i++) {

					if (i > 0 && i % 5 === 0) {
						this._postDelete(aMatnr);

						aMatnr = [];

					}
					var oContext = oTable.getContextByIndex(aIndices[i]);
					var oItem = oContext.getObject();

					aMatnr.push(oItem.Matnr);

				}

				if (aMatnr.length > 0) {
					this._postDelete(aMatnr);
				}

			}
		},

		_postDelete: function(aMatnr) {

			var oModel = this.getModel();
			var oViewModel = this.getModel("detailView");
			oViewModel.setProperty("/calbusy", true);
			
			var sMatnr = "";
			for(var i = 0; i < aMatnr.length; i++){
				if (i > 0) {
					sMatnr = sMatnr + ";" + aMatnr[i];
				} else {
					sMatnr = aMatnr[i];
				}
			}

			console.log(sMatnr);
			
			oModel.callFunction("/ChangeTmpl", {
				method: "POST",
				urlParameters: {
					"PlantID": this.plantID,
					"PRID": this.PRID,
					"LISTMATNR": sMatnr,
					"MODE": 'D',
					
				},
				success: function(oData, oResponse) {
					sap.m.MessageBox.success(oData.Message, {
						title: "Response",
						initialFocus: null
					});
					oViewModel.setProperty("/calbusy", false);
				}.bind(this),
				error: function(error) {
					oViewModel.setProperty("/calbusy", false);
				},
				async: false
			});

		},

		_onRouteMatched: function(oEvent) {
			this.plantID = oEvent.getParameter("arguments").plantId;
			this.CostCenterID = oEvent.getParameter("arguments").ccId;

			this.PRID = this.plantID + this.CostCenterID.substring(this.CostCenterID.length - 6, this.CostCenterID.length);

			this.oFilterPlant = new Filter("PlantID", FilterOperator.EQ, this.plantID); // Filter Plant
			this.oFilterTmplID = new Filter("PRID", FilterOperator.EQ, this.PRID); // Filter TemplateID

			this._refreshTable();

		},

		_refreshTable: function() {
			var oTable = this.byId("tmpltbl");
			var oBinding = oTable.getBinding("rows");

			if (oBinding) {
				oBinding.filter([this.oFilterPlant, this.oFilterTmplID], sap.ui.model.FilterType.Application);
			}
		},

		onExit: function() {

		}

	});

});