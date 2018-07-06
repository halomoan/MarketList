sap.ui.define([
	"sap/ui/demo/masterdetail/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/demo/masterdetail/model/formatter"
], function(BaseController,JSONModel,formatter) {
	"use strict";

	return BaseController.extend("sap.ui.demo.masterdetail.controller.MMarketList", {
			formatter: formatter,
		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf sap.ui.demo.masterdetail.view.MMarketListView
		 */
			onInit: function() {
				sap.ui.getCore().getEventBus().subscribe("marketlist","addMaterial",this._addMaterial,this);
				var oViewData = {
				};
				this.globalData = {
			    	iRefresh : 0
				};
				var oViewModel = new JSONModel(oViewData);
				this.setModel(oViewModel, "detailView");
				
				this.getRouter().getRoute("mastermobile").attachPatternMatched(this._onMasterMatched, this);
			},
			_onMasterMatched :  function(oEvent) {
				if (this.globalData.iRefresh === 0) {
					this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
				}
			},
			_onMetadataLoaded: function(){
				var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({pattern : "YYYYMMdd" }); 
				var oViewModel = this.getModel("detailView");
				var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
				var oLocalData = oStorage.get("localStorage");
				var oModelJson = new JSONModel();
				var oModelHeader = new JSONModel();
				var oView = this.getView();

				if (oLocalData) {
					
					oViewModel.setProperty("/PlantID",oLocalData.PlantID);
					oViewModel.setProperty("/Plant",oLocalData.Plant);
					oViewModel.setProperty("/CostCenterID",oLocalData.CostCenterID);
					oViewModel.setProperty("/CostCenterText",oLocalData.CostCenter);
					oViewModel.setProperty("/UnloadingPoint",oLocalData.UnloadingPoint);
					oViewModel.setProperty("/UserId",oLocalData.UserId);
				}
				var oModel = this.getOwnerComponent().getModel();
				var oFilters = [];
				oFilters.push( new sap.ui.model.Filter("PlantID", sap.ui.model.FilterOperator.EQ, oLocalData.PlantID) );
				oFilters.push( new sap.ui.model.Filter("CostCenterID", sap.ui.model.FilterOperator.EQ, oLocalData.CostCenterID) );
				oFilters.push( new sap.ui.model.Filter("UnloadingPoint", sap.ui.model.FilterOperator.EQ, oLocalData.UnloadingPoint) );
				oFilters.push( new sap.ui.model.Filter("Date", sap.ui.model.FilterOperator.EQ, dateFormat.format(new Date( (new Date()).getTime() + (24 * 60 * 60 * 1000)))));
				sap.ui.core.BusyIndicator.show();
				
				oModel.read("/MarketListHeaderSet", {
				    urlParameters: {
				        "$expand": "NavDetail"
				    },
				    filters: oFilters,
				    success: function(rData) {
				    	
				    	
				    	var oHeader = rData.results[0];
				    	
				    	oLocalData = oStorage.get("localStorage");
				    	oLocalData.Recipient = oHeader.Recipient;
				    	oLocalData.TrackingNo = oHeader.TrackingNo;
				    	oViewModel.setProperty("/Recipient",oLocalData.Recipient);
						oViewModel.setProperty("/TrackingNo",oLocalData.TrackingNo);
				    	oStorage.put("localStorage",oLocalData);
				    	
				    	oModelHeader.setData(oHeader.TableH);
				    	oView.setModel(oModelHeader,"TableH");
				    	
				    	var oDetail = oHeader.NavDetail.results;
				    	oModelJson.setData({ rows : oDetail } );
				    	
				    	console.log(oModelJson);
					    oView.setModel(oModelJson,"mktlist");
					    //oTable.bindRows("mktlist>/rows");
				    	sap.ui.core.BusyIndicator.hide();
				    	
				    	//console.log(oHeader,oDetail);
				    },
				    error: function(oError) {
			            sap.ui.core.BusyIndicator.hide();
			        }
				});
			},
			sectionPress: function(oEvent){
				alert("yes");
			}

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf sap.ui.demo.masterdetail.view.MMarketListView
		 */
		//	onBeforeRendering: function() {
		//
		//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf sap.ui.demo.masterdetail.view.MMarketListView
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf sap.ui.demo.masterdetail.view.MMarketListView
		 */
		//	onExit: function() {
		//
		//	}

	});

});