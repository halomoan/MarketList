sap.ui.define([
		"sap/ui/demo/masterdetail/controller/BaseController",
		"sap/ui/model/json/JSONModel",
		"sap/ui/core/library",
		'sap/viz/ui5/data/FlattenedDataset',
        'sap/viz/ui5/controls/common/feeds/FeedItem',
        'sap/viz/ui5/format/ChartFormatter',
        'sap/viz/ui5/api/env/Format',
		"sap/ui/demo/masterdetail/model/formatter"
	], function (BaseController, JSONModel, CoreLibrary, FlattenedDataset, FeedItem, ChartFormatter, Format,formatter) {
		"use strict";
		var ValueState = CoreLibrary.ValueState;
	
		
	return BaseController.extend("sap.ui.demo.masterdetail.controller.CostChartTime", {
		formatter: formatter,
		
		onInit: function() {
			this.oLocalData = {};
			var oViewData = {
				busy: false,
				busyIndicatorDelay: 0,
				chartType: {
					values: [
						{
							name: "Stacked Column Chart",
							vizType: "stacked_column",
							dim_val: "{lcl>Date_Formatted}",
							dim_type: "string",
							dim_uuid: "categoryAxis"
						},
						{
							name: "Timeseries Chart",
							vizType: "timeseries_line",
							dim_val: "{lcl>Date}",
							dim_type: "date",
							dim_uuid: "timeAxis"
						}
					]
				}
			};
			
			var oViewModel = new JSONModel(oViewData);
			this.setModel(oViewModel, "detailView");
			this.setDeviceModel();
			
			var oVizFrame = this.getView().byId("idVizFrame");
			Format.numericFormatter(ChartFormatter.getInstance());
			var formatPattern = ChartFormatter.DefaultPattern;
			
            var oPopOver = this.getView().byId("idPopOver");
            oPopOver.connect(oVizFrame.getVizUid());
            oPopOver.setFormatString(formatPattern.STANDARDFLOAT);
            
			this.getRouter().getRoute("costcharttime").attachPatternMatched(this._onMasterMatched, this);
		},
		
		_onMasterMatched:  function(oEvent) {
		
			var oArguments = oEvent.getParameter("arguments");
			this.oLocalData = this.getLocalData();
			this.oLocalData.PlantID = oArguments.plantId;
			this.oLocalData.CostCenterID = oArguments.ccId;
			this.oLocalData.SDate = oArguments.sdate;
			this.oLocalData.EDate = oArguments.edate;
			this.oLocalData.View = oArguments.view;
			
			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
		},
		
		_onMetadataLoaded: function(){
			
			var path = "/CostCenterSet('"+ this.oLocalData.CostCenterID  +"')";
			
			var oViewModel = this.getModel("detailView");
			
			var oUnloadingPoint = this.getView().byId("UP");
			var oItemSelectTemplate = new sap.ui.core.Item({
				key: "{UnLoadingPointID}",
				text: "{UnLoadingPoint}"
			});
			
		
			oViewModel.setProperty("/CostCenter", this.oLocalData.CostCenter);
		
			oUnloadingPoint.bindAggregation("items", {
				"path": path + "/CCUnloadingPoint",
				"template": oItemSelectTemplate,
				"events": {
					dataReceived: function() {
						oViewModel.setProperty("/busy", false);
					},
					dataRequested: function() {
						oViewModel.setProperty("/busy", true);
					}
				}

			});
			
			var oSDP = this.getView().byId("SDP");
			
			oSDP.setValue(this.oLocalData.SDate);
			
			var oEDP = this.getView().byId("EDP");
			oEDP.setValue(this.oLocalData.EDate);
			
			this.onRefresh();
		},
		
		onSDPChange: function(oEvent){
			var oDP = oEvent.getSource(),
				sValue = oEvent.getParameter("value"),
				bValid = oEvent.getParameter("valid");	
				
			if (bValid) {
				oDP.setValueState(ValueState.None);
			} else {
				oDP.setValueState(ValueState.Error);
			}
			var oEDP = this.getView().byId("EDP");
			
			var oSDate = new Date(oDP.getValue());
			var oEDate = new Date(oEDP.getValue());
			
			if (oSDate > oEDate){
				oDP.setValueState(ValueState.Error);	
			} else {
				oDP.setValueState(ValueState.None);
			}
		},
		onEDPChange: function(oEvent){
			var oDP = oEvent.getSource(),
				sValue = oEvent.getParameter("value"),
				bValid = oEvent.getParameter("valid");	
				
			if (bValid) {
				oDP.setValueState(ValueState.None);
			} else {
				oDP.setValueState(ValueState.Error);
			}
			var oSDP = this.getView().byId("SDP");
			
			var oEDate = new Date(oDP.getValue());
			var oSDate = new Date(oSDP.getValue());
			
			if (oSDate > oEDate){
				oDP.setValueState(ValueState.Error);	
			} else {
				oDP.setValueState(ValueState.None);
			}
			
		},
		onRefresh: function(){
			
			var oViewModel = this.getModel("detailView");
			
			var oChartType = this.getView().byId("chartRadioGroup");
			var iChartType = oChartType.getSelectedIndex();
			
			var aChartType = oViewModel.getProperty("/chartType/values");			
			
			var oFilters = [];
			
			var filter_plant = new sap.ui.model.Filter({
					path: 'PlantID', operator: sap.ui.model.FilterOperator.EQ, value1: this.oLocalData.PlantID
				});
			oFilters.push(filter_plant);
			
			var filter_cc = new sap.ui.model.Filter({
					path: 'CostCenterID', operator: sap.ui.model.FilterOperator.EQ, value1: this.oLocalData.CostCenterID
				});
				
			oFilters.push(filter_cc);	
			var oUP = this.getView().byId("UP");
			var sUP = oUP.getSelectedKey();
			
			if (sUP) {
				var filter_up = new sap.ui.model.Filter({
					path: 'UnloadingPointID', operator: sap.ui.model.FilterOperator.EQ, value1: sUP
				});
				oFilters.push(filter_up);
			}
			
			var oSDP = this.getView().byId("SDP");
			var oEDP = this.getView().byId("EDP");
			
			var filter_date = new sap.ui.model.Filter({
					path: 'Date', operator: sap.ui.model.FilterOperator.BT, value1: oSDP.getValue(), value2: oEDP.getValue()
				});
			+oFilters.push(filter_date);
			
			var oVizFrame = this.getView().byId("idVizFrame");
			oVizFrame.setVizType(aChartType[iChartType].vizType);
			
			var oModel = this.getView().getModel();
			var oThis = this;
			
			oModel.read("/UPCostSet",
				{
					filters: oFilters,
					success: function(oResponse){
						var aResult = oResponse.results;
						
						if ( aResult.length < 1 ) {
							var oGraphDataModel = new sap.ui.model.json.JSONModel({ "data" : [] });
							oVizFrame.setModel(oGraphDataModel,"lcl");
							return;
						}
						
					
						let aUP = aResult.map(a => a.UnloadingPointID.replace(" ","_"));
						aUP = [...new Set(aUP)]
						
						var oItem = {};
						for (var i = 0; i < aResult.length ; i++){
						
							var oDate = aResult[i].Date;
							var sKey = aResult[i].Date.valueOf();
							
							var sUP = aResult[i].UnloadingPointID.replace(" ","_");
							var iCost = aResult[i].Cost;
							if (!oItem[sKey]) oItem[sKey] = {};
							oItem[sKey]['Date'] = oDate;
							oItem[sKey]['Date_Formatted'] = formatter.dateFormat(oDate);
							oItem[sKey][sUP] = iCost;
						
							
						}
						
					
						var dataset = { 
							data: {
								path: "lcl>/data"
							}
						};
		                var dimensions = [{ name: 'Delivery Date', value: aChartType[iChartType].dim_val , dataType: aChartType[iChartType].dim_type}];
		                
						var measures = [];
						for (i = 0; i < aUP.length ; i++){
							var dim = { name: aUP[i], value: "{lcl>" + aUP[i] + "}" }; 
							measures.push(dim);
						}
						dataset.dimensions = dimensions;
		                dataset.measures = measures;
                		var oDataset = new FlattenedDataset(dataset);
                		
                		oVizFrame.destroyDataset();
                		oVizFrame.setDataset(oDataset);
                		
                		oVizFrame.destroyFeeds();
                		
		            	var feedValueAxis = new FeedItem({
				                    'uid': "valueAxis",
				                    'type': "Measure",
				                    'values': aUP
				                });
				        
				        var feedTimeAxis = new FeedItem({
				                    'uid': aChartType[iChartType].dim_uuid,
				                    'type': "Dimension",
				                    'values': ["Delivery Date"]
				                });        
		                
		                oVizFrame.addFeed(feedValueAxis);
		                oVizFrame.addFeed(feedTimeAxis);
                		
		                var aValue = Object.keys(oItem).map((key) => oItem[key]);
						var oGraphDataModel = new sap.ui.model.json.JSONModel({ "data" : aValue });
						oVizFrame.setModel(oGraphDataModel,"lcl");
					}
				}
			);
			
		},
		onNavBack: function(oEvent){
			history.go(-1);
		}



	});

});