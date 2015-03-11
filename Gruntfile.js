
module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            application: {
                files: {
                    "dist/<%= pkg.name %>.js": [
                        'src/module.prefix',
                        'src/**/_*.js',
                        'src/**/*.js',
                        'src/module.suffix'
                    ]
                }
            }
        },
        uglify: {
            options: {
                banner: '/* \n' +
                '   <%= pkg.name %> <%= pkg.version %> \n' +
                '*/\n',
                compress: {
                    drop_console: true
                },
                sourceMap: true
            },
            build: {
                src: 'dist/<%= pkg.name %>.js',
                dest: 'dist/<%= pkg.name %>.min.js'
            }
        },
        jshint: {
            // define the files to lint
            files: ['Gruntfile.js', 'src/**/*.js'],
            // configure JSHint (documented at http://www.jshint.com/docs/)
            options: {
                // more options here if you want to override JSHint defaults
                globals: {
                    jQuery: true,
                    console: true,
                    module: true
                }
            }
        },
        watch: {
            scripts: {
                files: ['Gruntfile.js', 'src/**/*.js', 'tests/**/*.js'],
                tasks: ['development_js']
            }
        },
        jasmine: {
            concated: {
                src: [
                    'dist/<%= pkg.name %>.js'
                ],
                options: {
                    vendor: [
                        'bower/angular/angular.min.js',
                        'bower/angular-jwt/dist/angular-jwt.js',
                        'bower/angular-mocks/angular-mocks.js'
                    ],
                    specs: ['test/**/*.js'],
                    template: require('grunt-template-jasmine-istanbul'),
                    templateOptions: {
                        coverage: 'coverage/coverage.json',
                        report: 'coverage'
                        //thresholds: {
                        //    lines: 75,
                        //    statements: 75,
                        //    branches: 75,
                        //    functions: 90
                        //}
                    }
                }
            },
            minimized: {
                src: 'dist/<%= pkg.name %>.min.js',
                options: {
                    vendor: [
                        'bower/angular/angular.min.js',
                        'bower/angular-jwt/dist/angular-jwt.js',
                        'bower/angular-mocks/angular-mocks.js'
                    ],
                    specs: ['test/**/*.js']
                }
            }
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-jasmine');

    // Default task(s).
    grunt.registerTask('development_js', ['jshint', 'concat', 'jasmine:concated']);
    grunt.registerTask('development', ['development_js']);
    grunt.registerTask('default', ['development', 'uglify']);
};