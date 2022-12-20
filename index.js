import { ApolloServer, gql } from "apollo-server";
import fetch from "node-fetch";

//define the type definitions
const typeDefs = gql`
  type Query {
    wallet(address: String, after: String): Wallet
  }

  type Wallet {
    tokens(after: String): TokenConnection
  }

  type TokenConnection {
    pageInfo: PageInfo
    edges: [TokenEdge]
  }

  type PageInfo {
    endCursor: String
    hasNextPage: Boolean
    hasPreviousPage: Boolean
    startCursor: String
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


  type Log {
    transaction: Transaction
    transactionHash: String
    type: String
  }

  type Transaction {
    valueInEth: Float
    blockNumber: Int
    estimatedConfirmedAt: String
  }
`;

//the resolvers contains the query object and istypeof of the ERC721Token
const resolvers = {
   //lets the GraphQL server to determine the correct type of the ERC721Token at runtime.
  ERC721Token: {
    __isTypeOf(obj) {
      return obj.tokenId !== undefined;
    },
  },
  Query: {
    wallet: (_, { address, after }) => {
      return fetch(`https://graphql.icy.tools/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            query($address: String, $after: String) {
              wallet(address: $address) {
                tokens(after: $after) {
                  pageInfo {
                    endCursor
                    hasNextPage
                    hasPreviousPage
                    startCursor
                  }
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
                              transaction {
                                valueInEth
                                blockNumber
                                estimatedConfirmedAt
                              }
                              transactionHash
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
          `,
          // required variable input to query the data
          variables: { address, after },
        }),
      })
        .then((res) => res.json())
        .then((res) => res.data.wallet)
        .catch((error) => {
          console.error(error);
        });
    },
  },
};

//the server takes in two arguements, the typedefs and the resolvers
const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
