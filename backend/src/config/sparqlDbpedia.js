import SparqlClient from 'sparql-client-2';

// Configuración para DBpedia
const endpointUrl = 'http://dbpedia.org/sparql';

// Crear un cliente SPARQL para conectar con DBpedia
const client = new SparqlClient(endpointUrl)
  .register({
    'Content-Type': 'application/sparql-query'
  });

// Exportamos el cliente para usarlo en el controlador
export default client;