/*global location */
sap.ui.define([
		"sap/ui/demo/masterdetail/controller/BaseController",
		"sap/ui/model/json/JSONModel",
		"sap/ui/demo/masterdetail/model/formatter"
	], function (BaseController, JSONModel, formatter) {
		"use strict";

		return BaseController.extend("sap.ui.demo.masterdetail.controller.DMarketList", {
			formatter: formatter,
			
			onInit : function () {
			    
			    sap.ui.getCore().getEventBus().subscribe("marketlist","addMaterial",this._addMaterial,this);
			    
			    this.globalData = {
			    	Dates : [],
			    	PREQNo : [],
			    	tableChanged : true,
			    	MarketListID : ""
			    };
			    
				var oViewData = {
					toogleFreeze : false,
					freezeCol : 4,
					columns : [
							{"date":"","noItem": 1 , "total" : 0, "visible": true},
							{"date":"","noItem": 0 , "total" : 0, "visible": false},
							{"date":"","noItem": 0 , "total" : 0, "visible": false},
							{"date":"","noItem": 0 , "total" : 0, "visible": false},
							{"date":"","noItem": 0 , "total" : 0, "visible": false},
							{"date":"","noItem": 0 , "total" : 0, "visible": false},
							{"date":"","noItem": 0 , "total" : 0, "visible": false},
							{"date":"","noItem": 1 , "total" : 0, "visible": true},
							{"date":"","noItem": 0 , "total" : 0, "visible": false},
							{"date":"","noItem": 0 , "total" : 0, "visible": false},
							{"date":"","noItem": 0 , "total" : 0, "visible": false},
							{"date":"","noItem": 0 , "total" : 0, "visible": false},
							{"date":"","noItem": 0 , "total" : 0, "visible": false},
							{"date":"","noItem": 0 , "total" : 0, "visible": false}
						]
				};
				
				var aSelectionItems = [];
				var sCurrentLocale = sap.ui.getCore().getConfiguration().getLanguage();
				var sDay = this.getResourceBundle().getText("day");
				
				for(var i = 1; i <= 7; i++) {
					if (sCurrentLocale.startsWith("en")){
						var sShowDay = (i > 1) ? sDay + "s": sDay;
					}
					aSelectionItems.push({key: (i + "Day"), text: this.getResourceBundle().getText(i) + " " +  sShowDay});
				}
				
				oViewData.noOfDays = aSelectionItems;

				var oViewModel = new JSONModel(oViewData);
				this.setModel(oViewModel, "detailView");
				
				
				this.getRouter().getRoute("master").attachPatternMatched(this._onMasterMatched, this);
				
				
				
			},
			_onMasterMatched :  function(oEvent) {
				this.globalData.MarketListID = oEvent.getParameter("arguments").marketlistID;
				this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
			},
			onExit:function(){
				
				sap.ui.getCore().getEventBus().unsubscribe("marketlist","addMaterial",this._addMaterial,this);
			},
			
			toggleFreeze: function(){
				
				var oViewModel = this.getModel("detailView"),
				    toogleFreeze = oViewModel.getProperty("/toogleFreeze"),
				    freezeCol =  oViewModel.getProperty("/freezeCol");
				if(toogleFreeze){
					this.byId("mktlistTable").setFixedColumnCount(freezeCol);   
				} else{
					this.byId("mktlistTable").setFixedColumnCount(0);
					 oViewModel.setProperty("/freezeCol",4);
				}   
				
			},
			
			addCommentPress: function(oEvent){
				var text = oEvent.getSource().data("myText");
				var sId = oEvent.getSource().data("myId");
				var sComment = oEvent.getSource().data("myComment");
				var oModel = this._oJsonModel;
			
				
				var itemId = sId.substr(0,sId.length - 3);
				var itemIdx = parseInt(sId.slice(-2));
				
				var dialog = new sap.m.Dialog({
					title: this.getResourceBundle().getText("addComment") + " " + text + " (" + itemId + ")" ,
					type: 'Message',
					content: [
							new sap.m.TextArea('commentTextArea', {
								width: '100%',
								placeholder: 'Add comment (optional)',
								value : sComment
							})
						],
						beginButton: new sap.m.Button({
							text:  this.getResourceBundle().getText("submit"),
							press: function () {
								var sText = sap.ui.getCore().byId('commentTextArea').getValue();
								sap.m.MessageToast.show('Add Comment : ' + sText);
								var rows = oModel.getData().rows;
								
							
								
								for(var key in rows) {
									if (rows[key].MaterialID === itemId){
										rows[key]["Day" + itemIdx].Comment = sText;
										oModel.refresh();
										break;
									}
								}
								
								dialog.close();
							}
						}),
						endButton: new sap.m.Button({
							text: this.getResourceBundle().getText("cancel"),
							press: function () {
								dialog.close();
							}
						}),
						afterClose: function() {
							dialog.destroy();
						}
				});

				dialog.open();
			},
			
			onSubmit: function() {
				if (!this._oViewFormSubmit) {
					this._oViewFormSubmit = sap.ui.xmlfragment("sap.ui.demo.masterdetail.view.submitForm", this);
					this.getView().addDependent(this._oViewFormSubmit);
					// forward compact/cozy style into Dialog
					this._oViewFormSubmit.addStyleClass(this.getOwnerComponent().getContentDensityClass());
				}
				
				
				this._oViewFormSubmit.open();
			},
			
			doSaveData: function() {
				
			},
			closeSaveDialog: function() {
				if (this._oViewFormSubmit) {
					this._oViewFormSubmit.close();
				}
			},
			onClose: function(){
				sap.ui.getCore().byId("__component0---app--idAppControl").hideMaster();
				this.getRouter().navTo("home", null, false);
			},
			onRowsDelete: function() {
					var oThis = this;
					
					
					if (oThis.byId("mktlistTable").getSelectedIndex() >= 0) {
						sap.m.MessageBox.confirm(oThis.getResourceBundle().getText("confirmDelMaterial"),{
							icon: sap.m.MessageBox.Icon.INFORMATION,
							title: oThis.getResourceBundle().getText("confirm"),
							actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
							onClose: function(oAction){
								if (oAction === sap.m.MessageBox.Action.YES) {
									oThis._deleteRows(oThis);	
								}
							}
						});
					} else{
						sap.m.MessageBox.error(oThis.getResourceBundle().getText("noSelection"), {
						    title: oThis.getResourceBundle().getText("warning"),                                     
						    onClose: null,                                       
						    styleClass: "",                                       
						    initialFocus: null,                                  
						    textDirection: sap.ui.core.TextDirection.Inherit     
						});
					}
			},
			
			_deleteRows : function(oThis) {
				var oTable = oThis.byId("mktlistTable");
				var iCount = 0;
				var tableRows = oThis._oJsonModel.getData().rows;
				
				var aIndices = oTable.getSelectedIndices();
				
				for (var i = aIndices.length - 1; i >=0; i--){
					tableRows.splice(aIndices[i],1);
					iCount++;
				}
				
				
				if(iCount > 0) {
					oTable.clearSelection();
					oThis._oJsonModel.refresh();
				}
				
				
				
			},
			
			onNoOfDaysChange : function(oEvent) {
				
				var keyItem;
				if(oEvent) {
					keyItem = oEvent.getParameter("selectedItem").getKey();
				}
				var iCols = 0;
				var oViewModel = this.getModel("detailView");
				
				this.globalData.tableChanged = false;
				
				switch (keyItem){
					case "1Day": iCols = 7; break;
					case "2Day": iCols = 8; break;
					case "3Day": iCols = 9; break;
					case "4Day": iCols = 10; break;
					case "5Day": iCols = 11; break;	
					case "6Day": iCols = 12; break;
					case "7Day": iCols = 13; break;
					default:  iCols = 7; break; 
				}
				
				//Current and Future Days
				for (var i = 7; i <= 13; i++){
					if (i > iCols) {
						oViewModel.setProperty("/columns/" + i + "/visible",false);	
					} else{
						oViewModel.setProperty("/columns/" + i + "/visible",true);	
					}
					
				}
				
				// Past Days
				for (i = 0; i <= 6; i++){
					if (i > (iCols - 7)) {
						oViewModel.setProperty("/columns/" + i + "/visible",false);	
					} else{
						oViewModel.setProperty("/columns/" + i + "/visible",true);		
					}
					
				}
			
			},
			
			_onTableChanged : function(oModelJson) {
				
					var data = oModelJson.getProperty("/rows");
					
					if (data && this.globalData.tableChanged) {
						
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
							/*if (data[key].Day0.Quantity > 0) {
								noItems[data[key].Day0.Date] = isNaN(noItems[data[key].Day0.Date]) ? 1 : (noItems[data[key].Day0.Date] + 1);
								if (isNaN(totals[data[key].Day0.Date])) {
									totals[data[key].Day0.Date] = (data[key].Day0.Quantity / data[key].PriceUnit * data[key].UnitPrice);
								}else{
									totals[data[key].Day0.Date] = totals[data[key].Day0.Date] + (data[key].Day0.Quantity / data[key].PriceUnit * data[key].UnitPrice);
								}
							}
							*/
						}

						
						
						/*for(var i = 0; i < data.length; i++) {
							var arr = data[i].Items;
							for (var j = 0; j < arr.length; j++) {
								if (arr[j].Quantity > 0) {
									
									noItems[arr[j].Date] = isNaN(noItems[arr[j].Date]) ? 1 : (noItems[arr[j].Date] + 1);
								
									if (isNaN(totals[arr[j].Date])) {
										totals[arr[j].Date] = (arr[j].Quantity / data[i].PriceUnit * data[i].UnitPrice);
									}else{
										totals[arr[j].Date] = totals[arr[j].Date] + (arr[j].Quantity / data[i].PriceUnit * data[i].UnitPrice);
									}
								}
							}
						}*/
		
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
			
					this.globalData.tableChanged = true;
			},
			_onMetadataLoaded: function(){
			
				
				var oTable = this.byId("mktlistTable");
				var oViewModel = this.getModel("detailView");
				var oModelJson = new JSONModel();
				var oView = this.getView();
				var oThis = this;
				
				var oModel = this.getOwnerComponent().getModel();
				
				
				var sPath = "/" + oModel.createKey("MarketListHeaderSet",{MarketListHeaderID:  this.globalData.MarketListID});
				
				
				this.getView().bindElement(sPath);
				
				sap.ui.core.BusyIndicator.show();
				oModel.read(sPath + "/MarketListDetailSet", {
				    method: "GET",
				    success: function(oData) {
				    	
				    	if (oData.results) {
					    	oModelJson.setData({ rows : oData.results } );
					    	oView.setModel(oModelJson,"mktlist");
					      	oTable.bindRows("mktlist>/rows");	
					      	var oItem = oData.results[0];
					      	
					      	
					      	
					      	oThis.globalData.Dates[0] = oItem.Day0.Date;
					      	oThis.globalData.Dates[1] = oItem.Day1.Date;
					      	oThis.globalData.Dates[2] = oItem.Day2.Date;
					      	oThis.globalData.Dates[3] = oItem.Day3.Date;
					      	oThis.globalData.Dates[4] = oItem.Day4.Date;
					      	oThis.globalData.Dates[5] = oItem.Day5.Date;
					      	oThis.globalData.Dates[6] = oItem.Day6.Date;
					      	oThis.globalData.Dates[7] = oItem.Day7.Date;
					      	oThis.globalData.Dates[8] = oItem.Day8.Date;
					      	oThis.globalData.Dates[9] = oItem.Day9.Date;
					      	oThis.globalData.Dates[10] = oItem.Day10.Date;
					      	oThis.globalData.Dates[11] = oItem.Day11.Date;
					      	oThis.globalData.Dates[12] = oItem.Day12.Date;
					      	oThis.globalData.Dates[13] = oItem.Day13.Date;
					      	
					      	
					      	oThis.globalData.PREQNo[0] =  oItem.Day0.PREQNo;
					      	oThis.globalData.PREQNo[1] =  oItem.Day1.PREQNo;
					      	oThis.globalData.PREQNo[2] =  oItem.Day2.PREQNo;
					      	oThis.globalData.PREQNo[3] =  oItem.Day3.PREQNo;
					      	oThis.globalData.PREQNo[4] =  oItem.Day4.PREQNo;
					      	oThis.globalData.PREQNo[5] =  oItem.Day5.PREQNo;
					      	oThis.globalData.PREQNo[6] =  oItem.Day6.PREQNo;
					      	oThis.globalData.PREQNo[7] =  oItem.Day7.PREQNo;
					      	oThis.globalData.PREQNo[8] =  oItem.Day8.PREQNo;
					      	oThis.globalData.PREQNo[9] =  oItem.Day9.PREQNo;
					      	oThis.globalData.PREQNo[10] =  oItem.Day10.PREQNo;
					      	oThis.globalData.PREQNo[11] =  oItem.Day11.PREQNo;
					      	oThis.globalData.PREQNo[12] =  oItem.Day12.PREQNo;
					      	oThis.globalData.PREQNo[13] =  oItem.Day13.PREQNo;
					      	
					      	
					      	
					      	oViewModel.setProperty("/columns/0/date",oThis.globalData.Dates[0]);
					      	oViewModel.setProperty("/columns/1/date",oThis.globalData.Dates[1]);
					      	oViewModel.setProperty("/columns/2/date",oThis.globalData.Dates[2]);
					      	oViewModel.setProperty("/columns/3/date",oThis.globalData.Dates[3]);
					      	oViewModel.setProperty("/columns/4/date",oThis.globalData.Dates[4]);
					      	oViewModel.setProperty("/columns/5/date",oThis.globalData.Dates[5]);
					      	oViewModel.setProperty("/columns/6/date",oThis.globalData.Dates[6]);
					      	oViewModel.setProperty("/columns/7/date",oThis.globalData.Dates[7]);
					      	oViewModel.setProperty("/columns/8/date",oThis.globalData.Dates[8]);
					      	oViewModel.setProperty("/columns/9/date",oThis.globalData.Dates[9]);
					      	oViewModel.setProperty("/columns/10/date",oThis.globalData.Dates[10]);
					      	oViewModel.setProperty("/columns/11/date",oThis.globalData.Dates[11]);
					      	oViewModel.setProperty("/columns/12/date",oThis.globalData.Dates[12]);
					      	oViewModel.setProperty("/columns/13/date",oThis.globalData.Dates[13]);
					      	
					      	
					      	
				    	}
				    
				      
						
						sap.ui.core.BusyIndicator.hide();	
				    },
				    error: function() {
						sap.ui.core.BusyIndicator.hide();
				    }
				});
				
				
				var binding =  new sap.ui.model.Binding(oModelJson, "/rows", oModelJson.getContext("/rows"));
				binding.attachChange(function() {
						this._onTableChanged(oModelJson);
						
				}.bind(this));
				
				this._oJsonModel = oModelJson;
				
			
			},
			
			_addMaterial: function(sChannel,sEvent,oData){
				
				
				if (oData ) {
					
				
					var tableRows = this._oJsonModel.getData().rows;

					var bNew = true,bAdded = false;
					for (var i = 0; i < oData.data.length; i++ ){
						
						bNew = true;
						for (var j = 0; j < tableRows.length; j++){
							if (tableRows[j].MaterialID === oData.data[i].MaterialID ){
								bNew = false;
								j = tableRows.length + 1;
							} 
							
						}
						
						if (bNew) {
				
							
							oData.data[i].Day0.Date = this.globalData.Dates[0];
							oData.data[i].Day1.Date = this.globalData.Dates[1];
							oData.data[i].Day2.Date = this.globalData.Dates[2];
							oData.data[i].Day3.Date = this.globalData.Dates[3];
							oData.data[i].Day4.Date = this.globalData.Dates[4];
							oData.data[i].Day5.Date = this.globalData.Dates[5];
							oData.data[i].Day6.Date = this.globalData.Dates[6];
							oData.data[i].Day7.Date = this.globalData.Dates[7];
							oData.data[i].Day8.Date = this.globalData.Dates[8];
							oData.data[i].Day9.Date = this.globalData.Dates[9];
							oData.data[i].Day10.Date = this.globalData.Dates[10];
							oData.data[i].Day11.Date = this.globalData.Dates[11];
							oData.data[i].Day12.Date = this.globalData.Dates[12];
							
							oData.data[i].Day0.PREQNo = this.globalData.PREQNo[0];
							oData.data[i].Day1.PREQNo = this.globalData.PREQNo[1];
							oData.data[i].Day2.PREQNo = this.globalData.PREQNo[2];
							oData.data[i].Day3.PREQNo = this.globalData.PREQNo[3];
							oData.data[i].Day4.PREQNo = this.globalData.PREQNo[4];
							oData.data[i].Day5.PREQNo = this.globalData.PREQNo[5];
							oData.data[i].Day6.PREQNo = this.globalData.PREQNo[6];
							oData.data[i].Day7.PREQNo = this.globalData.PREQNo[7];
							oData.data[i].Day8.PREQNo = this.globalData.PREQNo[8];
							oData.data[i].Day9.PREQNo = this.globalData.PREQNo[9];
							oData.data[i].Day10.PREQNo = this.globalData.PREQNo[10];
							oData.data[i].Day11.PREQNo = this.globalData.PREQNo[11];
							oData.data[i].Day12.PREQNo = this.globalData.PREQNo[12];
							
							oData.data[i].MarketListHeaderID =  this.globalData.MarketListID;
							oData.data[i].MarketListDetailID = null;
							
						
							tableRows.push(oData.data[i]);
						
							
							bAdded = true;
						} else {
							sap.m.MessageToast.show(oData.data[i].MaterialID + " - " + oData.data[i].MaterialText + " is already in the table.",{});	
						}
					}
					
					if (bAdded) {
						this._oJsonModel.refresh();
						sap.ui.getCore().byId("__component0---app--idAppControl").hideMaster();
					}
					
					
					
					
				}
			}
			
	});
});