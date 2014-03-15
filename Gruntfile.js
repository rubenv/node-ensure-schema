module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-bump');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-mocha-cli');

    grunt.initConfig({
        jshint: {
            all: ['lib/*.js', 'test/*.js'],
            options: {
                jshintrc: '.jshintrc'
            }
        },

        watch: {
            all: {
                options: {
                    atBegin: true
                },
                files: ['lib/**.js', 'test/*{,/*}'],
                tasks: ['test']
            }
        },

        mochacli: {
            options: {
                files: 'test/*.js'
            },
            spec: {
                options: {
                    reporter: 'spec'
                }
            }
        },

        bump: {
            options: {
                files: ['package.json'],
                commitFiles: ['-a'],
                pushTo: 'origin'
            }
        }
    });

    grunt.registerTask('default', ['test']);
    grunt.registerTask('build', ['jshint']);
    grunt.registerTask('test', ['build', 'mochacli']);
};
