//......................................................................
// 1. the transfer log, mint-log and order-log gets the blocknumber, estimatedConfirmedAt, and their respective values in eth
// 2. you can fecth the name of the token, the tokenid and the contract address through the ERC721Token node
//......................................................................


// import the required dependencies
import { ApolloServer, gql } from "apollo-server";
import fetch from "node-fetch";

//define the type definitions 
const typeDefs = gql`
  type Query {
    wallet(address: String): Wallet
  }

  type Wallet {
    tokens: TokenConnection
  }

  type TokenConnection {
    edges: [TokenEdge]
  }

  type TokenEdge {
    node: Token
  }

  interface Token {
    tokenId: String!
    name: String
    contract: Contract
    logs: LogConnection
  }

  type ERC721Token implements Token {
    tokenId: String!
    name: String
    contract: Contract
    logs: LogConnection
  }

  type Contract {
    address: String
  }

  type LogConnection {
    edges: [LogEdge]
  }

  type LogEdge {
    node: Log
  }

  enum LogType {
    MINT
    ORDER
    TRANSFER
  }

  interface Log {
    blockNumber: Int
    estimatedConfirmedAt: String
  }

  type MintLog implements Log {
    blockNumber: Int
    estimatedConfirmedAt: String
    transaction: Transaction
    type: LogType!
  }

  type TransferLog implements Log {
    blockNumber: Int
    estimatedConfirmedAt: String
    transaction: Transaction
    type: LogType!
  }

  type OrderLog implements Log {
    blockNumber: Int
    estimatedConfirmedAt: String
    transaction: Transaction
    type: LogType!
  }

  type Transaction {
    valueInEth: Float
  }
`;

//the resolvers contains the query object and istypeof of the ERC721Token and the log respectively
const resolvers = {
  //lets the GraphQL server to determine the correct type of the ERC721Token at runtime.
  ERC721Token: {
    __isTypeOf(obj) {
      return obj.tokenId !== undefined;
    },
  },
  //lets the GraphQL server to determine the correct type of the logs at runtime.
  Log: {
    __resolveType(log) {
      if (log.type === "MINT") {
        return "MintLog";
      } else if (log.type === "TRANSFER") {
        return "TransferLog";
      } else if (log.type === "ORDER") {
        return "OrderLog";
      }
      return null;
    },
  },
  //lets the GraphQL server to determine the correct type of the mintlogs at runtime.
  MintLog: {
    __isTypeOf(obj) {
      return obj.type === "MINT";
    },
  },
  //lets the GraphQL server to determine the correct type of the transferlogs at runtime.
  TransferLog: {
    __isTypeOf(obj) {
      return obj.type === "TRANSFER";
    },
  },
  //lets the GraphQL server to determine the correct type of the order-logs at runtime.
  OrderLog: {
    __isTypeOf(obj) {
      return obj.type === "ORDER";
    },
  },

  Query: {
    // wallet function takes in an address that fetches data from the icytool endpoint and returns the response
    wallet: (_, { address }) => {
      return fetch(`https://graphql.icy.tools/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // the query from the endpoint
          query: `
            query($address: String!) {
              wallet(address: $address) {
                tokens {
                  edges {
                    node {
                      ... on ERC721Token {
                        tokenId
                        name
                        contract {
                          address
                        }
                        logs {
                          edges {
                            node {
                              blockNumber
                              estimatedConfirmedAt
                              ... on MintLog {
                                transaction {
                                  valueInEth
                                }
                                type
                              }
                              ... on TransferLog {
                                transaction {
                                  valueInEth
                                }
                                type
                              }
                              ... on OrderLog {
                                transaction {
                                  valueInEth
                                }
                                type
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          `,
          // required variable input to query the data
          variables: { address },
        }),
      })
        .then((res) => res.json())
        .then((res) => res.data.wallet)
        .catch((error) => {
          console.error(error);
          // handles the error
        });
    },
  },
};

//the server takes in two arguements, the typedefs and the resolvers
const server = new ApolloServer({ typeDefs, resolvers });

//start the server
server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`);
});


