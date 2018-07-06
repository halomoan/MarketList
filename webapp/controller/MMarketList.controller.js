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
			    	iRefresh : 0,
			    	tableChanged : false
				};
				this._oJsonModel = null;
				
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
				this._oJsonModel = oModelJson;
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
				    	
				    	if (!oDetail) {
							oModelJson.setData({ rows : [] } );
						} else{
				    		oModelJson.setData({ rows : oDetail } );
						}
				    	
				    	console.log(oModelJson);
					    oView.setModel(oModelJson,"mktlist");
				    	sap.ui.core.BusyIndicator.hide();
				    	
				    	
				    	//console.log(oHeader,oDetail);
				    },
				    error: function(oError) {
			            sap.ui.core.BusyIndicator.hide();
			        }
				});
				
				var binding =  new sap.ui.model.Binding(oModelJson, "/rows", oModelJson.getContext("/rows"));
				binding.attachChange(function() {
						this._onTableChanged(oModelJson);
						
				}.bind(this));
			},
			
			_onTableChanged : function(oModelJson) {
				
					var data = oModelJson.getProperty("/rows");
					
					
					//if (data && this.globalData.tableChanged) {
					if(data) {
					
						
						
						var noItems = [], totals = [];
						
						for (var key in data) {
							for (var prop in data[key]){
								if(prop.substring(0,3) === "Day") {
									
									var oDay = data[key][prop];
									
									if (oDay.Quantity > 0) {
										noItems[oDay.Date] = isNaN(noItems[oDay.Date]) ? 1 : (noItems[oDay.Date] + 1);
										if (isNaN(totals[oDay.Date])) {
											totals[oDay.Date] = (oDay.Quantity / data[key].PriceUnit * data[key].UnitPrice);
										}else{
											totals[oDay.Date] = totals[oDay.Date] + (oDay.Quantity / data[key].PriceUnit * data[key].UnitPrice);
										}
									} else{
										if (isNaN(noItems[oDay.Date])) {
											noItems[oDay.Date] = 0;
										}
										if (isNaN(totals[oDay.Date])) {
											totals[oDay.Date] = 0.00;
										}
									}
								} 
							}
							
						}
						
						var oViewModel = this.getModel("detailView");
						
						
						var i = 0;
						for (key in noItems) {
							oViewModel.setProperty("/columns/" + (i++) + "/noItem",noItems[key]);
							
						}
						
						i = 0;	
						for (key in totals) {
							oViewModel.setProperty("/columns/" + (i++) + "/total",formatter.currencyValue(totals[key]));
						}
					}
					
					if(this.globalData.iRefresh++ > 0) {
						this.globalData.tableChanged = true;
					}
			
			},

			_addMaterial: function(sChannel,sEvent,oData){
				
				
				if (oData ) {
					
					var oTableH = this.getView().getModel("TableH").getData();
					var tableRows = this._oJsonModel.getData().rows;

					var bNew = true,bAdded = false;
					for (var i = 0; i < oData.data.length; i++ ){
						
						bNew = true;
						
						if (tableRows){
							for (var j = 0; j < tableRows.length; j++){
								if (tableRows[j].MaterialID === oData.data[i].MaterialID ){
									bNew = false;
									j = tableRows.length + 1;
								} 
								
							}
						}
						
						if (bNew) {
				
							
							oData.data[i].Day0.Date = oTableH.Date0;
							oData.data[i].Day1.Date = oTableH.Date1;
							oData.data[i].Day2.Date = oTableH.Date2;
							oData.data[i].Day3.Date = oTableH.Date3;
							oData.data[i].Day4.Date = oTableH.Date4;
							oData.data[i].Day5.Date = oTableH.Date5;
							oData.data[i].Day6.Date = oTableH.Date6;
							
							oData.data[i].Day0.PRID = "00000";
							oData.data[i].Day1.PRID = "00000";
							oData.data[i].Day2.PRID = "00000";
							oData.data[i].Day3.PRID = "00000";
							oData.data[i].Day4.PRID = "00000";
							oData.data[i].Day5.PRID = "00000";
							oData.data[i].Day6.PRID = "00000";
							
							oData.data[i].MarketListHeaderID =  this.globalData.MarketListID;
							oData.data[i].MarketListDetailID = "MKD0001";
							
							tableRows.push(oData.data[i]);
							
						
							
							bAdded = true;
						} else {
							sap.m.MessageToast.show(oData.data[i].MaterialID + " - " + oData.data[i].MaterialText + " is already in the table.",{});	
						}
					}
					
					if (bAdded) {
						this.globalData.tableChanged = true;
						this._oJsonModel.refresh();
						//sap.ui.getCore().byId("__component0---app--idAppControl").hideMaster();
					}

				}
			},
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
			onExit: function() {
				sap.ui.getCore().getEventBus().unsubscribe("marketlist","addMaterial",this._addMaterial,this);
			}

	});

});