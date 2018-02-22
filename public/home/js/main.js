let clientsTable; // Tabla clientes
let selectedClient; // Objeto que contiene los datos del cliente seleccionado;
let selectedClientRow; // ROW Actual seleccionada de clientsTable
let collapseReportStatus = 0;
let configColors = {
  owed: '#9E9E9E',
  paid: '#64B5F6'
};
let invoicesReport = {
  rows: [],
  tronit: 0,
  michcom: 0
}; // Objeto que contiene la información del reporte de facturas pendientes de un cliente

const formatClients = () => {
  return new Promise(resolve => {
    ajax({
      url: 'api/clients'
    }).then(data => {
      let clients = data.map((client, index) => {
        let owedStatus;

        if (client.amountOwed === 0) {
          owedStatus = 'SIN DEUDAS';
        } else {
          owedStatus = 'PENDIENTE';
        }

        client.rut = $.formatRut(client._id);
        client.owedStatus = owedStatus;
        client.invoiceOwed = client.invoiceOwed.reduce((final, actual) => final += actual + ' - ', '').slice(0, -3);
        client.amountOwed = `$ ${number_format(client.amountOwed)}`;

        delete client.status;
        delete client._id;
        delete client.type;

        return client;
      });

      return clients;
    }).then((clients) => {
      resolve(clients);
    });
  });
};

const chargeNewInvoiceForm = () => {
  $('#new').html(`
    <div class="card bg-light mb-3" >
        <div class="card-header text-center">
            <h2>INGRESAR NUEVA FACTURA AL SISTEMA<h2>
        </div>
        <div class="card-body row">
            <div class="col-md-4">
                <div class="form-group">
                    <label class="col-md-12 control-label"><i class="fa fa-asterisk" aria-hidden="true"></i> Número de factura</label>
                    <div class="col-md-12 inputGroupContainer">
                    <div class="input-group">
                    <input id="newInvoiceNumber" placeholder="N° de factura" class="form-control" type="number" min="1">
                    </div>
                    </div>
                </div>
            </div>

            <div class="col-md-4">
                <div class="form-group">
                    <label class="col-md-12 control-label" ><i class="fa fa-usd" aria-hidden="true"></i> Monto</label>
                    <div class="col-md-12 inputGroupContainer">
                    <div class="input-group">
                    <input id="newInvoiceAmount" placeholder="Monto de la factura" class="form-control" type="number" min="1">
                    </div>
                    </div>
                </div>
            </div>

            <div class="col-md-4">
                <div class="form-group">
                    <label class="col-md-12 control-label"><i class="fa fa-list" aria-hidden="true"></i> Tipo de factura</label>
                    <div class="col-md-12 selectContainer">
                        <div class="input-group">
                        <select id="newInvoiceType" class="form-control selectpicker" >
                            <option selected value="product">Producto</option>
                            <option value="service">Servicio</option>
                        </select>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-md-4">
                <div class="form-group">
                    <label class="col-md-12 control-label"><i class="fa fa-list" aria-hidden="true"></i> Razón social</label>
                    <div class="col-md-12 selectContainer">
                    <div class="input-group">
                        <select style="background:#ecf0f1;" id="newInvoiceBusiness" class="form-control selectpicker" disabled >
                            <option selected value="Michcom Ltda">Michcom Ltda</option>
                            <option value="Tronit Ltda">Tronit Ltda</option>
                        </select>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-md-4">
                <div class="form-group">
                    <label class="col-md-12 control-label"><i class="fa fa-pencil" aria-hidden="true"></i> Descripción</label>
                    <div class="col-md-12 inputGroupContainer">
                    <div class="input-group">
                    <textarea class="form-control" id="newInvoiceDescription" placeholder="Descripción de la factura"></textarea>
                        </div>
                    </div>
                </div>
            </div>


            <div class="col-md-4">
                <!-- Button -->
                <div class="form-group">
                    <label class="col-md-12 control-label"></label>
                    <div class="col-md-12">
                    <button id="sendNewInvoice" class="btn btn-primary btn-lg btn-block" >AGREGAR NUEVA FACTURA <span><i class="fa fa-paper-plane" aria-hidden="true"></i></span></button>
                    </div>
                </div>
            </div>

            <div style="display: none;" id="form_messages"></div>
        </div>
    </div>
	`);
};

const chargeInvoiceTable = (client) => { // TODO: HACER ESTE (funcion grande)
  let invoicesData = [];
  let totalClientPaidCount = 0; // Contador de facturas pagadas
  let totalClientOwedCount = 0; // Contador de facturas adeudadas
  let totalClientPaid = 0; // Monto total de las facturas pagadas por el cliente
  let totalClientOwed = 0; // Monto total de las facturas que debe el cliente
  let infoContent; // Contiene todo el html de infoContent

  invoicesData = client.invoices.map(invoice => {
    let reason;

    if (invoice.status === 'PENDIENTE') {
      totalClientOwed += invoice.amount;
    } else if (invoice.status === 'PAGADO') {
      totalClientPaid += invoice.amount;
    }

    if(!invoice.reason) {
      reason = ''
    } else {
      reason = invoice.reason
    }

    return {
      invoice: invoice.invoice,
      date: invoice.date,
      amount: '$ ' + number_format(invoice.amount),
      description: invoice.description,
      status: invoice.status,
      business: invoice.business,
      iva: '$ ' + number_format(invoice.iva),
      creationDate: invoice._id,
      reason: reason
    };
  });

  $('#invoices').empty();
  $('#invoices').html(`
    <div class="card bg-light mb-3">
        <div class="card-header text-center"><h2>FACTURAS</h2></div>
        <div class="card-body">
            <table id="invoiceTable" class="display nowrap table table-condensed" cellspacing="0">
                <thead>
                    <tr>
                        <th>N° Factura:</th>
                        <th>Fecha:</th>
                        <th>Monto:</th>
                        <th>Descripción:</th>
                        <th>Empresa:</th>
                        <th>Estado:</th>
                        <th>Iva:</th>
                        <th>Fecha creación</th>
                        <th>razón</th>
                    </tr>
                </thead>
            </table>
        </div>
    </div>
    `);

  invoiceTable = $('#invoiceTable')
    .DataTable({
      "iDisplayLength": 100,
      "dom": 'Bfrtip',
      "buttons": [{
        extend: 'pdfHtml5',
        customize: (doc) => {
          doc.content.splice(1, 0, {
            margin: [0, 0, 0, 12],
            alignment: 'center',
            image: base64logo
          });
        }
      }],
      "oLanguage": {
        "sSearch": "Buscar "
      },
      "order": [
        [0, "desc"]
      ],
      "responsive": true,
      "aaData": invoicesData,
      "columns": [{
          "data": "invoice"
        },
        {
          "data": "date"
        },
        {
          "data": "amount"
        },
        {
          "data": "description"
        },
        {
          "data": "business"
        },
        {
          "data": "status"
        },
        {
          "data": "iva"
        },
        {
          "data": "creationDate"
        },
        {
          "data": "reason"
        }
      ],
      "columnDefs": [{
        "targets": [6, 7, 8],
        "visible": false,
        "searchable": false
      }],
      createdRow: (row, data, dataIndex) => {
        if (data.status == `PAGADO`) {
          totalClientPaidCount++;
          $(row).css('background', configColors.paid);
        } else if (data.status == `PENDIENTE`) {
          totalClientOwedCount++;
          $(row).css('background', configColors.owed);
        }
      },
      initComplete: (settings, json) => {
        $('div.dataTables_filter input').focus();
        chargeClientCharts({
          paid: totalClientPaidCount,
          owed: totalClientOwedCount
        });
        $('#clientPaid').text("$ " + number_format(totalClientPaid));
        $('#clientOwed').text("$ " + number_format(totalClientOwed));
      }

    });

  invoiceTable.on('draw', function() {
    var body = $(invoiceTable.table().body());

    body.unhighlight();
    body.highlight(invoiceTable.search());
  });

  $('.dataTables_filter input').attr("placeholder", "Buscador");

  $('#invoiceTable tbody').on('dblclick', 'tr', function() {
    statusDataRow = invoiceTable.row($(this)).data();
    statusSelectedRow = invoiceTable.row($(this));
    invoiceNumberToChange = statusDataRow.invoice;

    console.log(statusDataRow)
    if (statusDataRow.status === 'PENDIENTE') {
      getTime().then(data => {
        let todayDate = moment(data).format('DD/MM/YYYY');
        let reasonHTML = '';

        if(statusDataRow.reason != '') {
            reasonHTML = `
            <tr class="table-danger">
                <th><h3>RAZÓN DE ANULACIÓN<h3></th>
                <th><h4>ESTA FACTURA FUE PAGADA Y LUEGO ANULADA POR LA SIGUIENTE RAZÓN:</h4> <br> <h3><b>${statusDataRow.reason.toUpperCase()}</b></h3></th>
            </tr>`
        }

        $('#infoContent').css('display', 'none');
        $('#invoiceStep').html(`
          <div class="card mb-3" >
              <div class="card-header text-center">
                  <a id="goBack" class="btn btn-default pull-left"><i class="fa fa-arrow-left" aria-hidden="true"></i></a><h2>INFORMACIÓN DE FACTURA <b>Nº${statusDataRow.invoice}</b><h2>
              </div>
              <div class="card-body row">

                  <div class="col-md-9">
                      <table class="table table-hover">
                          <tbody>
                              <tr class="table-light">
                                  <th><h3>MONTO TOTAL<h3></th>
                                  <th><h2><b>${statusDataRow.amount}</b><h2></th>
                              </tr>
                              <tr class="table-light">
                                  <th><h3>IVA</h3></th>
                                  <th><h2><b>${statusDataRow.iva}</b></h2></th>
                              </tr>
                              <tr class="table-light">
                                  <th><h3>ESTADO</h3></th>
                                  <th><h2 style="color:rgba(231, 76, 60,0.8)"><b>${statusDataRow.status}</b></h2></th>
                              </tr>
                              <tr class="table-light">
                                  <th><h3>DESCRIPCIÓN<h3></th>
                                  <th><h2><b>${statusDataRow.description}</b></h2></th>
                              </tr>
                              <tr class="table-light">
                                  <th><h3>RAZÓN SOCIAL<h3></th>
                                  <th><h2><b>${statusDataRow.business}</b></h2></th>
                              </tr>
                              <tr class="table-light">
                                  <th><h3>FECHA DE CREACIÓN<h3></th>
                                  <th><h2><b>${moment(statusDataRow.creationDate).format('DD/MM/YYYY hh:mm')}</b></h2></th>
                              </tr>
                              <tr class="table-light">
                                  <th><h3>FECHA PAGO DE FACTURA<h3></th>
                                  <th><input style="font-size:30px; width:200px;" type="text" name="invoiceDate" value="${todayDate}" /></th>
                              </tr>
                              ${reasonHTML}
                          </tbody>
                      </table>
                  </div>

                  <div class="col-md-3">
                      <button id="modInvoice" class="btn btn-secondary btn-lg btn-block"><i style="color:#FF9800" class="fa fa-pencil-square-o" aria-hidden="true"></i> Modificar Factura</button>
                      <br>
                      <button id="delInvoice" class="btn btn-secondary btn-lg btn-block"><i style="color:#F44336" class="fa fa-times" aria-hidden="true"></i> Eliminar Factura</button>
                      <br>
                      <button id="sendStatus" class="btn btn-secondary btn-lg btn-block"><i style="color:#2196F3" class="fa fa-retweet" aria-hidden="true"></i> Cambiar estado a PAGADO</button>
                      <br>
                      <div id="loadingStatus"></div>
                  </div>
              </div>

              <div class="card-footer">
                <center><h2><b>Historial de la factura</b></h2></center>
              </div>
              <div class="row" style="margin:10px;">
                <div class="list-group col-md-8" id="invoiceHistory">
                  <center><i style="color:#3498db;" class="fa fa-spinner fa-pulse fa-5x fa-fw"></i><span class="sr-only">Loading...</span></center>
                </div>
                <div class="col-md-4">
                 
                </div>  
              </div>
              
          </div>
         `);


        $('input[name="invoiceDate"]').daterangepicker({
          "locale": {
            "format": "DD/MM/YYYY",
            "daysOfWeek": [
              "Dom",
              "Lun",
              "Mar",
              "Mie",
              "Jue",
              "Vie",
              "Sab"
            ],
            "monthNames": [
              "Enero",
              "Febrero",
              "Marzo",
              "Abril",
              "Mayo",
              "Junio",
              "Julio",
              "Agosto",
              "Septiembre",
              "Octubre",
              "Noviembre",
              "Diciembre"
            ],
            "firstDay": 1
          },
          drops: "up",
          singleDatePicker: true,
          showDropdowns: true
        });

        $('input[name="invoiceDate"]').focus();
      });


    } else if (statusDataRow.status === 'PAGADO') {
      $('#infoContent').css('display', 'none');
      $('#invoiceStep').html(`
          <div class="card" >
              <div class="card-header text-center">
                  <a id="goBack" class="btn btn-default pull-left"><i class="fa fa-arrow-left" aria-hidden="true"></i></a><h2>INFORMACIÓN DE FACTURA <b>Nº${statusDataRow.invoice}</b><h2>
              </div>
              <div class="card-body row">

                  <div class="col-md-9">
                      <table class="table table-hover">
                          <tbody>
                              <tr class="table-light">
                                  <th><h3>MONTO TOTAL<h3></th>
                                  <th><h2><b>${statusDataRow.amount}</b><h2></th>
                              </tr>
                              <tr class="table-light">
                                  <th><h3>IVA</h3></th>
                                  <th><h2><b>${statusDataRow.iva}</b></h2></th>
                              </tr>
                              <tr class="table-light">
                                  <th><h3>ESTADO</h3></th>
                                  <th><h2 style="color:rgba(26, 188, 156,0.8)"><b>${statusDataRow.status}</b></h2></th>
                              </tr>
                              <tr class="table-light">
                                  <th><h3>DESCRIPCIÓN<h3></th>
                                  <th><h2><b>${statusDataRow.description}</b></h2></th>
                              </tr>
                              <tr class="table-light">
                                  <th><h3>RAZÓN SOCIAL<h3></th>
                                  <th><h2><b>${statusDataRow.business}</b></h2></th>
                              </tr>
                              <tr class="table-light">
                                  <th><h3>FECHA DE CREACIÓN<h3></th>
                                  <th><h2><b>${moment(statusDataRow.creationDate).format('DD/MM/YYYY hh:mm')}</b></h2></th>
                              </tr>
                              <tr class="table-light">
                                  <th><h3>FECHA DE PAGO<h3></th>
                                  <th><h2><b>${statusDataRow.date}</b></h2></th>
                              </tr>
                              <tr class="table-light">
                                  <th><h3>RAZÓN DE ANULACIÓN<h3></th>
                                  <th><textarea placeholder="ingrese la razón de anulación" class="form-control" rows="5" id="cancellation_reason"></textarea></th>
                              </tr>
                          </tbody>
                      </table>
                  </div>

                  <div class="col-md-3">
                      <button id="modInvoice" class="btn btn-secondary btn-lg btn-block"><i style="color:#FF9800" class="fa fa-pencil-square-o" aria-hidden="true"></i> Modificar Factura</button>
                      <br>
                      <button id="delInvoice" class="btn btn-secondary btn-lg btn-block"><i style="color:#F44336" class="fa fa-times" aria-hidden="true"></i> Eliminar Factura</button>
                      <br>
                      <button id="sendStatus" class="btn btn-secondary btn-lg btn-block"><i style="color:#2196F3" class="fa fa-retweet" aria-hidden="true"></i> Cambiar estado a PENDIENTE</button>
                      <br>
                      <div id="loadingStatus"></div>
                  </div>
              </div>

              <div class="card-footer">
                <center><h2><b>Historial de la factura </b></h2></center>
              </div>
              
              <div class="row" style="margin:10px;">
                <div class="list-group col-md-8" id="invoiceHistory">
                  <center><i style="color:#3498db;" class="fa fa-spinner fa-pulse fa-5x fa-fw"></i><span class="sr-only">Loading...</span></center>
                </div>
                <div class="col-md-4">
                  
                </div>  
              </div>
              

          </div>
		  	`);

        $('#cancellation_reason').focus();

    }

    ajax({ // Cargar historial de la factura
      type: 'POST',
      url: '/api/invoiceHistory',
      data: {invoice: statusDataRow.invoice}
    }).then(res=>{
      if(!res.err) {
        $('#invoiceHistory').empty();
        res.forEach(element => {
          $('#invoiceHistory').append(`
            <a href="#" class="list-group-item list-group-item-action flex-column align-items-start">
              <div class="d-flex w-100 justify-content-between">
                <h5 class="mb-3"><b>${element.userName}</b> <span style="color:#00a8ff;">${element.userEmail}</span></h5>
                <small class="text-muted">${moment(element._id).fromNow()}</small>
              </div>
              <h5>${element.description}</h5>
            </a>
          `);
        });
      } else {
        $('#invoiceHistory').html(`
          <div class="alert alert-dismissible alert-info">
            <h4 class="alert-heading">No existen registros historicos de la factura ${statusDataRow.invoice}</h4>
          </div>
        `);
      }
    });
  });


  $( "#invoiceStep" ).unbind( "click" ); // IMPORTANTE!! REINICIA TODOS LOS EVENTOS CLICK

  $('#invoiceStep').on('click', '#goBack', function() {
    $('#infoContent').css('display', 'inline');
    $('#invoiceStep').empty();
  });

  $('#invoiceStep').on('click', '#modInvoice', function() {
    var beforeMod = $('#invoiceStep').html();
    var filter1 = statusDataRow.amount.replace('$', '');
    var filter2 = filter1.split('.').join('');
    var filter3 = parseInt(filter2);
    var type = '';

    console.log(statusDataRow);
    $('#invoiceStep').empty();
    $('#invoiceStep').html(`
      <div class="card bg-light mb-3" >
          <div class="card-header text-center">
              <a id="goBack2" class="btn btn-default pull-left"><i class="fa fa-arrow-left" aria-hidden="true"></i></a> <h2>MODIFICAR FACTURA <b>${statusDataRow.invoice}</b><h2>
          </div>
          <div class="card-body row">
              <div class="col-md-4">
                  <div class="form-group">
                      <label class="col-md-12 control-label"><i class="fa fa-asterisk" aria-hidden="true"></i> Número de factura</label>
                      <div class="col-md-12 inputGroupContainer">
                          <div class="input-group">
                              <input id="modInvoiceNumber" placeholder="N° de factura" class="form-control" type="number" min="1" value="${statusDataRow.invoice}">
                          </div>
                      </div>
                  </div>
              </div>

              <div class="col-md-4">
                  <div class="form-group">
                      <label class="col-md-12 control-label" ><i class="fa fa-usd" aria-hidden="true"></i> Monto</label>
                      <div class="col-md-12 inputGroupContainer">
                          <div class="input-group">
                              <input id="modInvoiceAmount" placeholder="Monto de la factura" class="form-control" type="number" min="1" value ="${filter3}">
                          </div>
                      </div>
                  </div>
              </div>

              <div class="col-md-4">
                  <div class="form-group">
                      <label class="col-md-12 control-label"><i class="fa fa-list" aria-hidden="true"></i> Tipo de factura</label>
                      <div class="col-md-12 selectContainer">
                          <div class="input-group">
                              <select id="modInvoiceType" class="form-control selectpicker" >
                                  <option selected value="product">Producto</option>
                                  <option value="service">Servicio</option>
                              </select>
                          </div>
                      </div>
                  </div>
              </div>

              <div class="col-md-4">
                  <div class="form-group">
                      <label class="col-md-12 control-label"><i class="fa fa-list" aria-hidden="true"></i> Razón social</label>
                      <div class="col-md-12 selectContainer">
                          <div class="input-group">
                              <select style="background:#ecf0f1;" id="modInvoiceBusiness" class="form-control selectpicker" disabled >
                                  <option selected value="Michcom Ltda">Michcom Ltda</option>
                                  <option value="Tronit Ltda">Tronit Ltda</option>
                              </select>
                          </div>
                      </div>
                  </div>
              </div>

              <div class="col-md-4">
                  <div class="form-group">
                      <label class="col-md-12 control-label"><i class="fa fa-pencil" aria-hidden="true"></i> Descripción</label>
                      <div class="col-md-12 inputGroupContainer">
                          <div class="input-group">
                              <textarea class="form-control" id="modInvoiceDescription" placeholder="Descripción de la factura">${statusDataRow.description}</textarea>
                          </div>
                      </div>
                  </div>
              </div>

              <div class="col-md-4">
                  <!-- Button -->
                  <div class="form-group">
                  <label class="col-md-12 control-label"></label>
                  <div class="col-md-12">
                      <button id="sendModInvoice" class="btn btn-primary btn-lg btn-block" >Modificar <span><i class="fa fa-paper-plane" aria-hidden="true"></i></span></button>
                  </div>
                  </div>
              </div>

              <div style="display: none;" id="form_messages"></div>
          </div>
      </div>
		  `);

    if (statusDataRow.business == 'Tronit Ltda') {
      $('#modInvoiceType').val('service');
      $('#modInvoiceBusiness').val('Tronit Ltda');
    } else if (statusDataRow.business == 'Michcom Ltda') {
      $('#modInvoiceType').val('product');
      $('#modInvoiceBusiness').val('Michcom Ltda');
    }

    $('#modInvoiceType').on('change', function() {
      if ($('#modInvoiceType').val() === 'product') {
        $("#modInvoiceBusiness").val('Michcom Ltda');
      } else if ($('#modInvoiceType').val() === 'service') {
        $("#modInvoiceBusiness").val('Tronit Ltda');
      }
    });

    $('#goBack2').on('click', function() {
      $('#invoiceStep').html(beforeMod);
    })

    $('#sendModInvoice').on('click', function() { 
      let step = 0;
      let modInvoiceNumber = parseInt($('#modInvoiceNumber').val());
      let modInvoiceAmount = parseInt($('#modInvoiceAmount').val());
      let modInvoiceType = $('#modInvoiceType').val();
      let modInvoiceBusiness = $('#modInvoiceBusiness').val();
      let modInvoiceDescription = $('#modInvoiceDescription').val();
      let amountNew = modInvoiceAmount / ((19 / 100) + 1); 
      let amountTax = parseFloat(modInvoiceAmount) - parseFloat(amountNew);
      let iva = parseFloat(amountTax);
    
      if (modInvoiceType === 'service') {
        iva = 0;
      }
    
      // TODO: PROGRAMAR MENSAJES DE ERROR PARA CADA VALIDACIÓN
      if (modInvoiceNumber > 0 && Number.isInteger(modInvoiceNumber)) { // validar numero factura formulario
        $('#modInvoiceNumber').css('border', '1px solid green');
        step++;
      } else {
        $('#modInvoiceNumber').css('border', '1px solid red');
      }
    
      if (modInvoiceAmount > 0 && Number.isInteger(modInvoiceAmount)) { // validar precio factura formulario
        $('#modInvoiceAmount').css('border', '1px solid green');
        step++;
      } else {
        $('#modInvoiceAmount').css('border', '1px solid red');
      }
    
      if (modInvoiceDescription.length >= 5 && modInvoiceDescription.length <= 500) { // validar descripción factura formulario
        $('#modInvoiceDescription').css('border', '1px solid green');
        step++;
      } else {
        $('#modInvoiceDescription').css('border', '1px solid red');
      }
    
      $('#modInvoiceType').css('border', '1px solid green');
      $('#modInvoiceBusiness').css('border', '1px solid green');
    
      if (step === 3) {
        let sendModData = {
          rut: selectedClient.rut,
          id: statusDataRow.creationDate,
          invoice: modInvoiceNumber,
          originalInvoiceNumber: statusDataRow.invoice,
          originalBusiness: statusDataRow.business,
          business: modInvoiceBusiness,
          amount: modInvoiceAmount,
          invoice_type: modInvoiceType,
          description: modInvoiceDescription,
          date: '-',
          iva: iva
        };

        console.log(JSON.stringify(sendModData));
        
        ajax({ // enviar nueva factura 
          url: 'api/modInvoice',
          type: 'POST',
          data: {fullData: JSON.stringify(sendModData)}
        }).then(data => {
          console.log(data);
          
          if (data.error) {
            $('#modInvoiceNumber').css('border', '1px solid red');
            $('#form_messages').html('<div class="alert alert-danger"><center>' + data.error + '</center></div>');
            $('#form_messages').slideDown({
              opacity: "show"
            }, "slow");
            $('#sendModInvoice').prop('disabled', false);
    
          } else if (data.ok) {
            //$('#clientInfo').modal('dispose');
            $('#form_messages').html('<div class="alert alert-success"><center>' + data.ok + '</center></div>');
            $('#form_messages').slideDown({
              opacity: "show"
            }, "slow");
            //$('.nav-pills a[href="#info"]').tab('show'); // ir a pestaña de información del cliente
            $('#infoContent').css('display', 'inline');
            $('#invoiceStep').empty();
            chargeModal({
              id: selectedClient.rut
            }); // Recargar toda la información del cliente
            toastr.success(`FACTURA <b>${modInvoiceNumber}</b> MODIFICADA CORRECTAMENTE PARA EL CLIENTE <b>${selectedClient.name}</b>`);
    
            createLog({
              form: 'Facturas',
              desc: 'Se modificó la factura ' + modInvoiceNumber + ' al cliente ' + selectedClient.rut + ' (' + selectedClient.name + ')',
              extra: modInvoiceNumber
            });
    
            chargeChart(); // recargar grafico de pantalla principal
            // REINICIAR FORMULARIO 
            $('#modInvoiceNumber').val('');
            $('#modInvoiceNumber').css('border', '1px solid #CCCCCC');
            $('#modInvoiceAmount').val('');
            $('#modInvoiceAmount').css('border', '1px solid #CCCCCC');
            $('#modInvoiceType').css('border', '1px solid #CCCCCC');
            $('#modInvoiceBusiness').css('border', '1px solid #CCCCCC');
            $('#modInvoiceDescription').val('');
            $('#modInvoiceDescription').css('border', '1px solid #CCCCCC');
            $('#sendModInvoice').prop('disabled', false);
            $('#form_messages').empty();
    
          }
        });
      }
    });
  });

  $('#invoiceStep').on('click', '#delInvoice', function() { //TODO: BORRAR FACTURA
    swal({
      title: '¿Estás seguro de eliminar la factura ' + statusDataRow.invoice + '?',
      text: '',
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Si, Eliminar!',
      cancelButtonText: 'No, cancelar!',
      confirmButtonClass: 'btn btn-danger',
      cancelButtonClass: 'btn btn-primary',
      buttonsStyling: false,
      animation: false,
      customClass: 'animated tada'
    }).then(function(action) {
      if (action.value) {
        $('#modInvoice').addClass('disabled');
        $('#delInvoice').addClass('disabled');
        $('#sendStatus').addClass('disabled');
        $('#loadingStatus').html('<center><i style="color:#3498db;" class="fa fa-spinner fa-pulse fa-5x fa-fw"></i><span class="sr-only">Loading...</span></center>');
        ajax({
          url: '/api/deleteInvoice',
          type: 'POST',
          data: {
            invoice: statusDataRow.invoice,
            business: statusDataRow.business
          }
        }).then((data) => {
          chargeModal({
            id: selectedClient.rut
          }); // Recargar toda la información del cliente
          toastr.success(`FACTURA <b>${statusDataRow.invoice}</b> ELIMINADA CORRECTAMENTE`);
          chargeChart(); // recargar grafico de pantalla principal
          $('#infoContent').css('display', 'inline');
          $('#invoiceStep').empty();
          createLog({
            form: 'Facturas',
            desc: 'Se eliminó la factura ' + statusDataRow.invoice + ' del cliente ' + selectedClient.rut + ' (' + selectedClient.name + ')',
            extra: statusDataRow.invoice
          });
        });
      }
    });
  });


  $('#invoiceStep').on('click', '#sendStatus', function() { // cambiar estado de factura
    var invoicePaidDate = '';
    var postData = {};
    var reason = '';

    $('#loadingStatus').html('<center><i style="color:#3498db;" class="fa fa-spinner fa-pulse fa-5x fa-fw"></i><span class="sr-only">Loading...</span></center>');
    $('#modInvoice').addClass('disabled');
    $('#delInvoice').addClass('disabled');
    $('#sendStatus').addClass('disabled');
    /* FALTA VALIDAR LENGTH*/
    if (statusDataRow.status === 'PAGADO') {
      reason = $('#cancellation_reason').val();

      if (reason === '') {
        reason = 'Sin razón asignada';
      }

      postData = {
        invoice: invoiceNumberToChange,
        reason: reason,
        date: '-',
        business: statusDataRow.business,
        originalStatus: 'PAGADO'
      };

    } else if (statusDataRow.status === 'PENDIENTE') {
      invoicePaidDate = $('input[name="invoiceDate"]').val();

      postData = {
        invoice: invoiceNumberToChange,
        reason: '',
        date: invoicePaidDate,
        business: statusDataRow.business,
        originalStatus: 'PENDIENTE'
      };
    }
    //$('#infoContent').css('visibility', 'visible');
    //$('#invoiceStep').empty();

    ajax({url: 'api/changeInvoiceState', type:'POST', data: postData}).then(res=>{
      chargeModal({
        id: selectedClient.rut
      }); // Recargar toda la información del cliente
      chargeChart(); // recargar grafico de pantalla principal
      $('#infoContent').css('display', 'inline');
      $('#invoiceStep').empty();
      if (res.status === 'PENDIENTE') {
        toastr.success(`Estado de factura <b>${statusDataRow.invoice}</b> cambiada de <b>PAGADO</b> a <b>PENDIENTE</b> correctamente`);
        createLog({
          form: 'Facturas',
          desc: 'Se cambió el estado de la factura ' + statusDataRow.invoice + ' del cliente ' + selectedClient.rut + ' (' + selectedClient.name + ') de PAGADO a PENDIENTE',
          extra: statusDataRow.invoice
        });
      } else if (res.status === 'PAGADO') {
        toastr.success(`Estado de factura <b>${statusDataRow.invoice}</b> cambiada de <b>PENDIENTE</b> a <b>PAGADO</b> correctamente`);
        createLog({
          form: 'Facturas',
          desc: 'Se cambió el estado de la factura ' + statusDataRow.invoice + ' del cliente ' + selectedClient.rut + ' (' + selectedClient.name + ') de PENDIENTE a PAGADO',
          extra: statusDataRow.invoice
        });
      }
    });
  });
}; // FIN FUNCION GRADE!!!!!!!!!!!!!!!!!!!!!!!!!

const chargeModal = ({id}) => {
  //jQuery.noConflict();
  $('#clientInfo').modal('show');
  $('.nav-pills a[href="#info"]').tab('show'); // ir a pestaña de información del cliente
  $('#invoices').empty();
  $('#clientData').html('<center><i style="color:#3498db;" class="fa fa-spinner fa-pulse fa-5x fa-fw"></i><span class="sr-only">Loading...</span><br><h3 style="color:#3498db;">Cargando datos del cliente...</h3></center>');
  $('#modal_title').html('<i style="color:#3498db;" class="fa fa-spinner fa-pulse fa-1x fa-fw"></i><span class="sr-only">Loading...</span><br><h3 style="color:#3498db;"></h3>');

  ajax({
    url: 'api/client',
    type: 'POST',
    data: {
      rut: id
    }
  }).then(data => {
    var client = data;

    selectedClient = client;
    $('#newInvoiceTabButton').removeClass('disabled'); // activar botón para cargar información con datos de cliente actualizado
    $('#generateReportTabButton').removeClass('disabled'); // activar botón para cargar información con datos de cliente actualizado
    var owedStatus = '';
    if (client.amountOwed === 0) {
      owedStatus = 'SIN DEUDAS';
    } else {
      owedStatus = 'PENDIENTE';
    }

    /* Recargar el row de clientsTable siempre que se cargue la pestaña de información del cliente */
    selectedClientRow.remove().draw();
    selectedClientRow = clientsTable.row.add({
      "name": client.name,
      "rut": $.formatRut(client.rut),
      "invoiceOwed": client.invoiceOwed.reduce((final, actual) => final += actual + ' - ', '').slice(0, -3),
      "owedStatus": owedStatus,
      "amountOwed": `$ ${number_format(client.amountOwed)}`
    }).draw();
    chargeTotalOweds();

    $('#modal_title').text(data.name);
    $('#clientData').html(`
            <br>
            <div class="row">
                <div class="col-md-6 col-xs-12 card" style="height:300px;">
                    <center>	<h3>Monto adeudado PENDIENTE</h3> </center>
                    <div style="height: 5px; width:100%; background-color:${configColors.owed};"></div>
                    <center> <h2 id="clientOwed"></h2> </center>
                    <br>
                    <center>	<h3>Ganancias totales</h3> </center>
                    <div style="height: 5px; width:100%; background-color:${configColors.paid};"></div>
                    <center> <h2 id="clientPaid"></h2> </center>
                </div>

                <div class="col-md-6 col-xs-12 card">
                    <div id="totalClientChart" style="height: 300px; margin: 0 auto"></div>
                </div>
            </div>

            <br>

            <div class="row">
                <div class="col-md-4 col-xs-12 box-shadows">
                    <center>	<h2>Rut</h2> </center>
                    <center> <h1><b> ${$.formatRut(client.rut)} </b></h1> </center>
                </div>
                <div class="col-md-4 col-xs-12 box-shadows">
                    <center>	<h2>dirección</h2> </center>
                    <center> <h3> ${client.address} </h3> </center>
                </div>
                <div class="col-md-4 col-xs-12 box-shadows">
                    <center>	<h2>Correo/s</h2> </center>
                    <ul id="email-list" class="list-group">
                    </ul>
                </div>
            </div>
        `);

    $('#email-list').empty();

    client.emails.forEach(val => {
      $('#email-list').append('<li class="list-group-item">' + val + '</li>');
    });

    chargeInvoiceTable(client);
  });
};

const chargeClientsTable = (clientsData) => {
  clientsTable = $('#clientsTable')
    .DataTable({
      "iDisplayLength": 100,
      "dom": 'Bfrtip',
      "buttons": [{
          extend: 'pdfHtml5',
          customize: function(doc) {
            doc.content.splice(1, 0, {
              margin: [0, 0, 0, 12],
              alignment: 'center',
              image: base64logo
            });
          }
        },
        'excel'
      ],
      "oLanguage": {
        "sSearch": "Buscar "
      },
      "responsive": true,
      "aaData": clientsData,
      "columns": [{
          "data": "name"
        },
        {
          "data": "rut"
        },
        {
          "data": "invoiceOwed"
        },
        {
          "data": "owedStatus"
        },
        {
          "data": "amountOwed"
        }
      ],
      /*
      	    "columnDefs": [
                  { className: "toRight", "targets": [1] }
              ],*/
      createdRow: function(row, data, dataIndex) {
        if (data.owedStatus == `SIN DEUDAS`) {
          $(row).css('background', configColors.paid);
        } else if (data.owedStatus == `PENDIENTE`) {
          $(row).css('background', configColors.owed);
        }
      },
      initComplete: function(settings, json) {
        $('div.dataTables_filter input').focus();
        chargeChart();
      }
    });

  $('#clientsTable tbody').on('dblclick', 'tr', function() {
    //$('#infoContent').css('visibility', 'visible');
    $('#infoContent').css('display', 'inline');
    $('#invoiceStep').empty();
    $('.nav-tabs a[href="#info"]').tab('show');
    $('#newInvoiceTabButton').addClass('disabled'); // desactivar botón para evitar cargar información antes de actualizar datos del cliente
    $('#generateReportTabButton').addClass('disabled'); // desactivar botón para evitar cargar información antes de actualizar datos del cliente
    selectedClientRow = clientsTable.row($(this));
    // Limpiar de puntos y guion para busqueda de cliente en base de datos (id = rut)
    var rowData = clientsTable.row($(this)).data();
    var replace1 = rowData.rut.split('.').join('');
    var replace2 = replace1.replace('-', '');

    //selectedClientRow = datatable.row( $(this) );
    chargeModal({
      id: replace2
    });
  });

  // TODO: averiguar para que sirve esto xdd
  clientsTable.on('draw', function() {
    var body = $(clientsTable.table().body());

    body.unhighlight();
    body.highlight(clientsTable.search());
  });

  $('.dataTables_filter input').attr("placeholder", "Buscador");

  NProgress.done(); /* TABLA DE CLIENTES CARGADA */
};

const chargeChart = () => {
  ajax({
    url: 'api/clients/countStatus'
  }).then(res => {
    Highcharts.chart('totalChart', {
      chart: {
        plotBackgroundColor: null,
        plotBorderWidth: null,
        plotShadow: false,
        type: 'pie'
      },
      title: {
        text: ``
      },
      subtitle: {
        text: `PENDIENTES: ${res.owed} - SIN DEUDAS: ${res.paid}`
      },
      tooltip: {
        pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
      },
      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: {
            enabled: true,
            format: '<b>{point.name}</b>: {point.percentage:.1f} %',
            style: {
              color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
            }
          }
        }
      },
      series: [{
        name: 'porcentaje',
        colorByPoint: true,
        data: [{
          name: 'SIN DEUDAS',
          y: res.paid,
          color: configColors.paid
        }, {
          name: 'PENDIENTES',
          y: res.owed,
          color: configColors.owed
        }]
      }]
    });
  });
};

function chargeClientCharts({
  paid,
  owed
}) {
  Highcharts.chart('totalClientChart', {
    chart: {
      plotBackgroundColor: null,
      plotBorderWidth: null,
      plotShadow: false,
      type: 'pie'
    },
    title: {
      text: `Facturas`
    },
    subtitle: {
      text: `PENDIENTES: ${owed} - PAGADOS: ${paid}`
    },
    tooltip: {
      pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: {
          enabled: true,
          format: '<b>{point.name}</b>: {point.percentage:.1f} %',
          style: {
            color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
          }
        }
      }
    },
    series: [{
      name: 'porcentaje',
      colorByPoint: true,
      data: [{
        name: 'PAGADO',
        y: paid,
        color: configColors.paid
      }, {
        name: 'PENDIENTE',
        y: owed,
        color: configColors.owed
      }]
    }]
  });
}

const chargeTotalOweds = () => { // Cargar adeudado a las empresas de todos los clientes en pantalla principal
  $('#michcomTotalOwed').html('<i style="color:#3498db;" class="fa fa-spinner fa-pulse fa-5x fa-fw"></i><span class="sr-only">Loading...</span>');
  $('#tronitTotalOwed').html('<i style="color:#3498db;" class="fa fa-spinner fa-pulse fa-5x fa-fw"></i><span class="sr-only">Loading...</span>');
  $('#totalOwed').html('<i style="color:#3498db;" class="fa fa-spinner fa-pulse fa-5x fa-fw"></i><span class="sr-only">Loading...</span>');

  ajax({
    url: 'api/invoiceAmount'
  }).then(data => {
    $('#michcomTotalOwed').html(`<h3>$ ${number_format(data.michcom)}</h3>`);
    $('#tronitTotalOwed').html(`<h3>$ ${number_format(data.tronit)}</h3>`);
    $('#totalOwed').html(`<h1>$ ${number_format(data.totalAmount)}</h1>`);
  });
};

/*
    DOCUMENT READY
*/
$(document).ready(() => {
  $('#loadingClientsTable').append('<center><i style="color:#3498db;" class="fa fa-spinner fa-pulse fa-5x fa-fw"></i><span class="sr-only">Loading...</span><br><h3 style="color:#3498db;">Cargando clientes...</h3></center>');
  chargeTotalOweds();
  formatClients().then(data => {
    $('#loadingClientsTable').empty();
    chargeClientsTable(data);
  });
});

// EVENTOS
$("a[href='#new']").on('show.bs.tab', function(e) {
  chargeNewInvoiceForm();
});

$("a[href='#generate_report']").on('show.bs.tab', function(e) {
  collapseReportStatus = 0;
  $('#collapseEmail').collapse('hide'); // esconder collapse al abrir pestaña
  $('#collapseEmail').empty();

  $('#report_table_invoices').html('<i style="color:#3498db;" class="fa fa-spinner fa-pulse fa-5x fa-fw"></i><span class="sr-only">Loading...</span>');
  $('#initpdf').addClass('disabled');
  $('#sendEmail').addClass('disabled');
  getTime().then(res => {
    let report_date = moment(res).format('dddd DD [de] MMMM [de] YYYY').toUpperCase();
    $('#report_date').text(report_date);
    invoicesReport.date = report_date;
  });

  ajax({
    url: '/api/invoices/owed',
    type: 'POST',
    data: {
      rut: selectedClient.rut
    }
  }).then(res => {
    $('#report_table_invoices').empty();
    invoicesReport.rows = [];
    invoicesReport.tronit = 0;
    invoicesReport.michcom = 0;

    if(res.error) {
      toastr.warning('El cliente no tiene facturas pendientes!');
      $('.nav-pills a[href="#info"]').tab('show'); // ir a pestaña de información del cliente
    } else {
      res.forEach(el => {
        if (el.business == 'Tronit Ltda') invoicesReport.tronit += el.amount;
        if (el.business == 'Michcom Ltda') invoicesReport.michcom += el.amount;
  
        invoicesReport.rows.push([el.invoice, el.description, el.business, '$' + number_format(el.amount)]);
        $('#report_table_invoices').append(`
            <tr>
                <td>${el.invoice}</td>
                <td>${el.description}</td>
                <td>${el.business}</td>
                <td>$ ${number_format(el.amount)}</td>
            </tr>
        `);
      });
    }

    $('#michcomReportTotalOwed').text('$'+ number_format(invoicesReport.michcom));
    $('#tronitReportTotalOwed').text('$' + number_format(invoicesReport.tronit));
    
    $('#initpdf').removeClass('disabled');
    $('#sendEmail').removeClass('disabled');
  });


  invoicesReport.report_businnes_name = selectedClient.name;
  invoicesReport.report_businnes_rut = $.formatRut(selectedClient.rut);
  invoicesReport.report_businnes_address = selectedClient.address;

  $('#report_business_name').text(selectedClient.name);
  $('#report_business_rut').text($.formatRut(selectedClient.rut));
  $('#report_business_address').text(selectedClient.address);
});

$('#new').on('change', '#newInvoiceType', function() {
  if ($('#newInvoiceType').val() === 'product') {
    $("#newInvoiceBusiness").val('Michcom Ltda');
  } else if ($('#newInvoiceType').val() === 'service') {
    $("#newInvoiceBusiness").val('Tronit Ltda');
  }
});

$('#new').on('click', '#sendNewInvoice', function() { // EVENTO CREAR NUEVA FACTURA
  $('#infoContent').css({
    'display': 'inline'
  });
  $('#invoiceStep').empty();
  $('#sendNewInvoice').prop('disabled', true); // deshabilitar boton enviar nueva factura

  setTimeout(function() { // luego de 3 segundos lo habilitamos (en caso de que no se envíe) //TODO: si se demora en enviar se habilita igual (ARREGLAR)
    $('#sendNewInvoice').prop('disabled', false);
  }, 3000);

  $('#form_messages').empty();

  var step = 0; // Pasos de validación formulario nueva factura
  var newInvoiceNumber = parseInt($('#newInvoiceNumber').val()); /*      OBTENER VALORES DE LOS INPUTS NUEVA FACTURA       */
  var newInvoiceAmount = parseInt($('#newInvoiceAmount').val());
  var newInvoiceType = $('#newInvoiceType').val();
  var newInvoiceBusiness = $('#newInvoiceBusiness').val();
  var newInvoiceDescription = $('#newInvoiceDescription').val();
  var amountNew = newInvoiceAmount / ((19 / 100) + 1);
  var amountTax = parseFloat(newInvoiceAmount) - parseFloat(amountNew);
  var iva = parseFloat(amountTax);

  if (newInvoiceType === 'service') {
    iva = 0;
  }

  // TODO: PROGRAMAR MENSAJES DE ERROR PARA CADA VALIDACIÓN
  if (newInvoiceNumber > 0 && Number.isInteger(newInvoiceNumber)) { // validar numero factura formulario
    $('#newInvoiceNumber').css('border', '1px solid green');
    step++;
  } else {
    $('#newInvoiceNumber').css('border', '1px solid red');
  }

  if (newInvoiceAmount > 0 && Number.isInteger(newInvoiceAmount)) { // validar precio factura formulario
    $('#newInvoiceAmount').css('border', '1px solid green');
    step++;
  } else {
    $('#newInvoiceAmount').css('border', '1px solid red');
  }

  if (newInvoiceDescription.length >= 5 && newInvoiceDescription.length <= 500) { // validar descripción factura formulario
    $('#newInvoiceDescription').css('border', '1px solid green');
    step++;
  } else {
    $('#newInvoiceDescription').css('border', '1px solid red');
  }

  $('#newInvoiceType').css('border', '1px solid green');
  $('#newInvoiceBusiness').css('border', '1px solid green');

  if (step === 3) {
    let sendData = {
      rut: selectedClient.rut,
      invoice: newInvoiceNumber,
      business: newInvoiceBusiness,
      amount: newInvoiceAmount,
      invoice_type: newInvoiceType,
      description: newInvoiceDescription,
      date: '-',
      iva: iva
    };

    ajax({ // enviar nueva factura 
      url: 'api/invoice',
      type: 'POST',
      data: sendData
    }).then(data => {
      if (data.error) {
        $('#newInvoiceNumber').css('border', '1px solid red');
        $('#form_messages').html('<div class="alert alert-danger"><center>' + data.error + '</center></div>');
        $('#form_messages').slideDown({
          opacity: "show"
        }, "slow");
        $('#sendNewInvoice').prop('disabled', false);

      } else if (data.ok) {
        $('#form_messages').html('<div class="alert alert-success"><center>' + data.ok + '</center></div>');
        $('#form_messages').slideDown({
          opacity: "show"
        }, "slow");
        $('.nav-pills a[href="#info"]').tab('show'); // ir a pestaña de información del cliente
        chargeModal({
          id: selectedClient.rut
        }); // Recargar toda la información del cliente
        toastr.success(`FACTURA <b>${newInvoiceNumber}</b> CREADA CORRECTAMENTE PARA EL CLIENTE <b>${selectedClient.name}</b>`);

        createLog({
          form: 'Facturas',
          desc: 'Se agregó la factura ' + newInvoiceNumber + ' al cliente ' + selectedClient.rut + ' (' + selectedClient.name + ')',
          extra: newInvoiceNumber
        });

        chargeChart(); // recargar grafico de pantalla principal
        /* REINICIAR FORMULARIO */
        $('#newInvoiceNumber').val('');
        $('#newInvoiceNumber').css('border', '1px solid #CCCCCC');
        $('#newInvoiceAmount').val('');
        $('#newInvoiceAmount').css('border', '1px solid #CCCCCC');
        $('#newInvoiceType').css('border', '1px solid #CCCCCC');
        $('#newInvoiceBusiness').css('border', '1px solid #CCCCCC');
        $('#newInvoiceDescription').val('');
        $('#newInvoiceDescription').css('border', '1px solid #CCCCCC');
        $('#sendNewInvoice').prop('disabled', false);
        $('#form_messages').empty();

      }
    });
  }

});

$('#modal_body').on('click', '#reportCollapseButton', () =>  { // seleccionar emails de clientes para enviar reportes
  $('#collapseEmail').empty();
  if (collapseReportStatus == 0) {
    collapseReportStatus = 1;
    if(selectedClient.emails == null || selectedClient.emails.length < 1) {
      $('#collapseEmail').html(`
      <div class="alert alert-warning" role="alert">
        Cliente sin correos asignados
      </div>
      `);
      $('#collapseEmail').collapse('show');   
    } else {
      $('#collapseEmail').empty();
      
      selectedClient.emails.forEach((val, index) => {  
        $('#collapseEmail').append(`
          <li class="list-group-item text-center"> ${val} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <span><input class="form-check-input" type="checkbox" checked value="${val}" id="emailCheckbox${index}"></span></li>
        `);
      });

      $('#collapseEmail').append('<button id="sendEmailBtn" class="btn btn-primary btn-block"><i class="fa fa-paper-plane" aria-hidden="true"></i> Enviar</button>');
      $('#collapseEmail').collapse('show');    
    }
  } else if (collapseReportStatus == 1) {
    collapseReportStatus = 0;
    $('#collapseEmail').collapse('hide'); 
  }
});

$('#modal_body').on('click', '#sendEmailBtn', () =>  { // enviar reporte por correo
  var sendEmailsArr= Array.from($('#collapseEmail')[0].children);
  var arrToSend = [];

  sendEmailsArr.forEach(element => {
    if(element.children[0].localName == 'span') {
      if(element.children[0].children[0].checked) {
        arrToSend.push($.trim(element.children[0].children[0].value));
      }
    } 
  });

  if(arrToSend.length < 1) {
    toastr.warning('Para enviar reportes debe seleccionar como mínimo 1 correo electrónico del cliente');
  } else {
    $('#sendEmailBtn').addClass('disabled');
    /* API ENVIAR CORREOS */
    $('#sendEmailBtn').html('<i style="color:white;" class="fa fa-spinner fa-pulse fa-fw"></i>');
    ajax({
      url: 'api/send_pending_report',
      type: 'POST',
      data: {to: JSON.stringify(arrToSend), html: $('#reportDiv').html()}
    }).then(data => {
      // TODO: cargando... en espera de respuesta y mensaje de alerta al terminar (correcto o error)

      if (data.ok) {
        swal({
          title: 'Reporte enviado correctamente!',
          text: '',
          type: 'success',
          showCancelButton: false,
          confirmButtonColor: '#3085d6',
          confirmButtonText: 'Listo',
          confirmButtonClass: 'btn btn-primary',
          animation: true,
          timer: 5000
        });
      } else if (data.error){
        toastr.error('No se pudo enviar el reporte. Por favor intentelo mas tarde.');
      }

      $('#sendEmailBtn').html('<i class="fa fa-paper-plane" aria-hidden="true"></i> Enviar');
      collapseReportStatus = 0;
      $('#collapseEmail').collapse('hide');
      $('#collapseEmail').empty(); 
    });
  }  
});

$('#modal_body').on('click', '#initpdf', () =>  { // exportar a pdf

  var columns = ["N° Factura", "Descripción", "Razón social", "Monto"];
  var doc = new jsPDF('p', 'pt');

  doc.setFontSize(12);
  doc.setFontType('bold');
  doc.text(10, 30, invoicesReport.report_businnes_name);
  doc.text(550, 50, invoicesReport.date, null, null, 'right');
  doc.text(10, 50, invoicesReport.report_businnes_rut);
  doc.text(10, 70, invoicesReport.report_businnes_address);

  doc.setFontSize(10);
  doc.setFontType('normal');
  doc.text(10, 110, 'Estimado cliente:');
  doc.text(10, 130, `Según lo observado en nuestra gestión de cobros, se encuentra pendiente de pagos las facturas según detalle. Las que \n agradecemos cancelar e indicar comprobantes de pago en caso de haber sido canceladas a la fecha.`);

  doc.autoTable(columns, invoicesReport.rows, {
    margin: {
      top: 150
    }
  });

  let finalY = doc.autoTable.previous.finalY + 20;

  doc.setFontType('bold');
  doc.setFontSize(15);
  doc.text(50, finalY, 'Michcom Ltda: ');
  doc.text(170, finalY, `$ ${number_format(invoicesReport.michcom)}`);

  doc.text(300, finalY, 'Tronit Ltda: ');
  doc.text(400, finalY, `$ ${number_format(invoicesReport.tronit)}`);

  doc.setFontSize(10);
  finalY += 30;

  doc.text(10, finalY, `Recordamos que pueden hacer su pago a través de depósito y/o transferencia bancaria a la siguiente cuenta corriente \n como corresponda.`);

  doc.text(10, finalY + 40, 'Nombre: ');
  doc.setFontType('bold');
  doc.text(60, finalY + 40, 'Asesorias y Servicios Tecnologicos Miguel Esteban Herrera Ureta E.I.R.L. (Tronit Ltda)');

  doc.setFontType('normal');
  doc.text(10, finalY + 60, 'Banco: ');
  doc.setFontType('bold');
  doc.text(60, finalY + 60, 'Itaú');

  doc.setFontType('normal');
  doc.text(10, finalY + 80, 'Rut: ');
  doc.setFontType('bold');
  doc.text(60, finalY + 80, '76.623.477-1');

  doc.setFontType('normal');
  doc.text(10, finalY + 100, 'N° Cuenta: ');
  doc.setFontType('bold');
  doc.text(60, finalY + 100, '02 07 13 28 23');

  /* OTRA */

  doc.setFontType('normal');
  doc.text(10, finalY + 140, 'Nombre: ');
  doc.setFontType('bold');
  doc.text(60, finalY + 140, 'Comercial Servicios y Asesorias M y G Limitada. (Michcom Ltda)');

  doc.setFontType('normal');
  doc.text(10, finalY + 160, 'Banco: ');
  doc.setFontType('bold');
  doc.text(60, finalY + 160, 'Itaú');

  doc.setFontType('normal');
  doc.text(10, finalY + 180, 'Rut: ');
  doc.setFontType('bold');
  doc.text(60, finalY + 180, '76.235.643-0');

  doc.setFontType('normal');
  doc.text(10, finalY + 200, 'N° Cuenta: ');
  doc.setFontType('bold');
  doc.text(60, finalY + 200, '02 06 71 15 32');

  doc.setFontType('normal');
  doc.text(10, finalY + 240, 'Atentamente.');
  doc.text(10, finalY + 250, 'Departamento de Gestión y Cobros.-');

  doc.text(270, doc.internal.pageSize.height - 10, 'MICHCOM LTDA');

  doc.save(`${invoicesReport.report_businnes_name} ${invoicesReport.date}.pdf`);
});
