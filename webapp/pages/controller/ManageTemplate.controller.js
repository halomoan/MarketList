sap.ui.define([
	"sap/ui/demo/masterdetail/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator',
], function(BaseController, JSONModel, Filter, FilterOperator) {
	"use strict";

	return BaseController.extend("sap.ui.demo.masterdetail.pages.controller.ManageTemplate", {

		onInit: function() {
			var oViewData = {
				calbusy: false,
				calbusyindicator: 0,
				totalCount: 0

			};
			var oViewModel = new JSONModel(oViewData);
			this.setModel(oViewModel, "detailView");
			
			this.oColModel = new JSONModel(sap.ui.require.toUrl("sap/ui/demo/masterdetail/fragments/") + "/VHMaterialColumnsModel.json");
			
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

		onVHMaterialRequested: function() {

			var sPlantID = this.plantID;

			var aCols = this.oColModel.getData().cols;
			
			this._oBasicSearchField = new sap.m.SearchField({
				showSearchButton: false
			});
	
			if (!this._oValueHelpDialog) {
				this._oValueHelpDialog = sap.ui.xmlfragment("sap.ui.demo.masterdetail.fragments.VHMaterial", this);
				this.getView().addDependent(this._oValueHelpDialog);
				
				
				var oMatGroup = sap.ui.getCore().byId("MatGroup");
			

				if (oMatGroup.getBinding("suggestionItems") === undefined) {
					oMatGroup.bindAggregation("suggestionItems", {
						path: "/MaterialGroups",
						template: new sap.ui.core.Item({
							key: "{MaterialGroupID}",
							text: "{MaterialGroupName}"
						}),
						filters: [new Filter("PlantID", FilterOperator.EQ, sPlantID)]
					});
	
				}
			
			}
		

			//this._oValueHelpDialog.setSupportMultiselect(false); 


			 var oFilterBar = this._oValueHelpDialog.getFilterBar();
			 oFilterBar.setFilterBarExpanded(false);
			 oFilterBar.setBasicSearch(this._oBasicSearchField);

			this._oValueHelpDialog.getTableAsync().then(function(oTable) {
				oTable.setModel(this.oColModel, "columns");

				if (oTable.bindRows) {
					oTable.bindAggregation("rows", {
						path: "/PlantMaterialSet",
						filters: [this.oFilterPlant]
					});
				}

				if (oTable.bindItems) {
					oTable.bindAggregation("items", {
						path: "/PlantMaterialSet",
						filters: [this.oFilterPlant]
					}, function() {
						return new sap.m.ColumnListItem({
							cells: aCols.map(function(column) {
								return new sap.m.Label({
									text: "{" + column.template + "}"
								});
							})
						});
					});
				}

				this._oValueHelpDialog.update();
			}.bind(this));

			this._oValueHelpDialog.open();
		},
		
		onValueHelpOkPress: function(oEvent) {
			
			
			var aTokens = oEvent.getParameter("tokens");

			if (aTokens.length) {
				
				var oModel = this.getModel();
				var oViewModel = this.getModel("detailView");
				oViewModel.setProperty("/calbusy", true);
				
				oModel.setUseBatch(true);
				oModel.setDeferredGroups(["createTemplate"]);
				var mParameters = { 
						groupId:"createTemplate",
						success:function(odata, resp){  oViewModel.setProperty("/calbusy", false); },
						error: function(odata, resp) { oViewModel.setProperty("/calbusy", false); }
					
				};

				
				for (var i = 0; i < aTokens.length; i++) {
					var oObject = aTokens[i].data().row;
					var oMaterial = {
						"PlantID": this.plantID,
						"PRID" : this.PRID,
						"Matnr" : oObject.Matnr,       
						"InTemplt": true
					};
					oModel.create("/MarketListTmplSet", oMaterial, mParameters);
				}
				
				oModel.submitChanges(mParameters);
			}
			this._oValueHelpDialog.close();
		},
		
		onFilterBarSearch: function(oEvent) {

			var sSearchQuery = this._oBasicSearchField.getValue(),
				aSelectionSet = oEvent.getParameter("selectionSet");
			var aFilters = aSelectionSet.reduce(function(aResult, oControl) {

				var sType = oControl.getMetadata().getName();
				switch (sType) {
					case "sap.m.Switch":
						if (oControl.getState()) {
							aResult.push(new Filter({
								path: oControl.getName(),
								operator: FilterOperator.EQ,
								value1: oControl.getState()
							}));
						}

						break;
					case "sap.m.Input":
						if (oControl.getValue()) {
							aResult.push(new Filter({
								path: oControl.getName(),
								operator: FilterOperator.Contains,
								value1: oControl.getValue()
							}));
						}
						break;

					case "sap.m.CheckBox":
						if (oControl.getSelected()) {
							aResult.push(new Filter({
								path: oControl.getName(),
								operator: FilterOperator.EQ,
								value1: true
							}));
						}

						break;
				}
				return aResult;
			}, []);

			if (sSearchQuery) {

				aFilters.push(new Filter({
					filters: [
						new Filter({
							path: "Maktx",
							operator: FilterOperator.Contains,
							value1: sSearchQuery
						})
					],
					and: false
				}));
			}

			if (aFilters.length > 0) {
				this._filterTable(new Filter({
					filters: aFilters,
					and: true
				}));
			} else {
				this._filterTable([]);
			}
		},
		
		onValueHelpCancelPress: function() {
			this._oValueHelpDialog.close();
		},

		// onValueHelpAfterClose: function() {
		// 	this._oValueHelpDialog.destroy();
		// },

		_filterTable: function(oFilter) {
			var oValueHelpDialog = this._oValueHelpDialog;

			oValueHelpDialog.getTableAsync().then(function(oTable) {
				if (oTable.bindRows) {
					oTable.getBinding("rows").filter(oFilter);
				}

				if (oTable.bindItems) {
					oTable.getBinding("items").filter(oFilter);
				}

				oValueHelpDialog.update();
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
			for (var i = 0; i < aMatnr.length; i++) {
				if (i > 0) {
					sMatnr = sMatnr + ";" + aMatnr[i];
				} else {
					sMatnr = aMatnr[i];
				}
			}

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

			
			var oTable = this.byId("tmpltbl");
			var oBinding = oTable.getBinding("rows");
			oBinding.attachChange(function(sReason) {
				var oViewModel = this.getModel("detailView");
				oViewModel.setProperty("/totalCount", oBinding.getLength());
			   
			}.bind(this));
			
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