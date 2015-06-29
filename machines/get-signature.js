module.exports = {


  friendlyName: 'Get signature',


  description: 'Lookup top-level metadata, dehydrate the machine definitions, and compute a hash for the public API of this machinepack.',


  cacheable: true,


  inputs: {

    dir: {
      description: 'The path to the machinepack (if path is not absolute, will be resolved from the current working directory)',
      example: '/Users/mikermcneil/machinepack-foo/',
      required: true
    }

  },


  exits: {

    success: {
      variableName: 'result',
      example: {
        pack: {},
        machines: [{}],
        hash: 'a8319azj39$29130nfan3'
      },
      description: 'Done.',
    },

  },


  fn: function (inputs,exits) {

    var path = require('path');
    var Arrays = require('machinepack-arrays');
    var JSON = require('machinepack-json');
    var Util = require('machinepack-util');
    var thisPack = require('../');

    // Resolve absolute path
    inputs.dir = path.resolve(process.cwd(), inputs.dir);

    // Read local pack
    thisPack.readPackageJson({
      dir: inputs.dir
    }).exec({
      error: exits.error,
      success: function(packMetadata) {

        // Run some logic (the "iteratee") once for each item of an array.
        Arrays.map({
          array: packMetadata.machines,
          itemExample: {},
          iteratee: function(_inputs, _exits) {

            var machineIdentity = _inputs.item;

            // Read machine file located at the specified path into a JSON string w/ stringified functions.
            thisPack.readMachineFile({
              source: path.resolve(inputs.dir, packMetadata.machineDir, machineIdentity + '.js')
            }).exec({
              error: _exits.error,
              success: function (jsonStr){
                // Parse machine data from the JSON-encoded string.
                JSON.parse({
                  json: jsonStr,
                  schema: {},
                }).exec({
                  error: _exits.error,
                  success: _exits.success
                });
              }
            });
          }
        }).exec({
          error: exits.error,
          success: function(machineDefs) {

            // Generate unique hash
            Util.hash({
              value: {
                pack: packMetadata,
                machines: machineDefs
              },
            }).exec({
              error: exits.error,
              success: function(hash){
                return exits.success({
                  pack: packMetadata,
                  machines: machineDefs,
                  hash: hash
                });
              }
            });

          }
        });

      }
    });
  }


};