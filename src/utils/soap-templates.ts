export function buildSoapRequestSat(pUsuario: string, pClave:string, pTipo:string,pPlaca:string){
    return `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope
  xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:ep="http://ep.ws.mingob.sat.gob.gt">
  <soapenv:Body soapenv:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
    <ep:datosGralesVeh>
      <pUsuario xsi:type="xsd:string">${pUsuario}</pUsuario>
      <pClave   xsi:type="xsd:string">${pClave}</pClave>
      <pTipo    xsi:type="xsd:string">${pTipo}</pTipo>
      <pPlaca   xsi:type="xsd:string">${pPlaca}</pPlaca>
    </ep:datosGralesVeh>
  </soapenv:Body>
</soapenv:Envelope>`;
}