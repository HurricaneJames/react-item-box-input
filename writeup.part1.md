# Retrospective: Building and Packaging an Interactive React.js Component

One day my boss told me he wants an item list input component. My first thought was, what the heck is that. Well, think of your email browser. You start typing a name, get a drop down of options, select one, and a little email "badge", the item, is added to the input box. It is possible to navigate the item list input with a keyboard and delete items with backspace.

After examinging the problem I told him it would take me at least a day or two. It looks like a simple enough problem, but it required testing that I had not done with React before. Also, I had a "feeling" it was going to be more complicated that it seemed at first blush.

Anyway, it was placed in the backlog because we had more important stuff to do. I suspect it is still sitting there somewhere, along with a ton of other nifty ideas that nobody remembers. However, it never left my mind. So, one Saturday a few weeks back I decided I had to write the thing.

After finishing this component, I decided that I really needed to write up my experience. Up to this point, all my articles use Rails and Jest. This time, however, we are going to use [karma-runner](http://karma-runner.github.io), [mocha.js](http://mochajs.org/), [sinon.js](http://sinonjs.org/), and [expect.js](https://github.com/Automattic/expect.js) to TDD our way through building an npm package that can be included in other libraries. While we go, we will discuss some of the issues that I came across and how I solved them.


## Table of Contents

Fair warning, this writeup ended up being substantially longer that I ever could have imagined. I ended up breaking it into a few sections.

1. Getting Ready to TDD a Component with Karma and Mocha
2. The Items and Input
3. Keyboard Navigation
4. Component Events
5. Writing some Examples

## Initial Setup

First things first, we need a basic setup. Some people use [Yeoman](http://yeoman.io/). Me, I tend to copy what I already have and patch it as I go. So, for the time being, I'm just going to copy over some files from another one of my projects (and I probably poached those from [Dan Abramov (@dan_abramov)](https://twitter.com/dan_abramov)). In all honesty, you are probably better going with Yeoman.

Regardless of how we get or initial setup, we will need to fill in some info in the package.json. If you do not have anything to base it on, you can use [npm init](https://docs.npmjs.com/cli/init). It will ask a bunch of questions and spit out a decent starting `package.json`. This time, I'm going to use an existing template.

    {
      "name": "react-item-box-input",
      "version": "1.0.0",
      "description": "An input box with items",
      "main": "dist/ItemBox.js",
      "scripts": {
        "build": "./scripts/build",
        "test": "./scripts/test",
        "test-cov": "./scripts/test-cov",
        "prepublish": "npm run build"
      },
      "repository": {
        "type": "git",
        "url": "https://github.com/HurricaneJames/react-item-box-input"
      },
      "keywords": [
        "react",
        "react-component",
        "input",
        "list"
      ],
      "author": "James Burnett <HurricaneJamesEsq@gmail.com> (https://github.com/HurricaneJames/react-item-box-input)",
      "license": "MIT",
      "bugs": {
        "url": "https://github.com/HurricaneJames/react-item-box-input/issues"
      },
      "homepage": "https://github.com/HurricaneJames/react-item-box-input",
      "peerDependencies": {
        "react": "^0.13.2",
        "react-immutable-proptypes": "^0.1.7",
      },
      "devDependencies": {
        "babel": "^4.6.6",
        "babel-eslint": "^3.1.1",
        "babelify": "^6.1.0",
        "eslint": "^0.21.0",
        "eslint-plugin-react": "^2.2.0",
        "expect.js": "^0.3.1",
        "immutable": "^3.7.2",
        "istanbul": "~0.3.7",
        "jsdom": "^3.1.0",
        "karma": "^0.12.31",
        "karma-browserify": "^4.1.2",
        "karma-chrome-launcher": "^0.1.10",
        "karma-firefox-launcher": "^0.1.6",
        "karma-mocha": "^0.1.10",
        "karma-sinon": "^1.0.4",
        "karma-source-map-support": "^1.0.0",
        "mocha": "^2.0.1",
        "sinon": "^1.14.1"
      }
    }

Most of the fields are fairly obvious: name, description, repository, etc... Pay careful attention to "main", that is what will be loaded when the package is require'd into another project.

>Sidenote: I originally called this project react-item-box-input. At some point while writing down my thoughts on how it was made, it because obvious that it should be called react-item-list-input. However, I notice that it already has over 120 downloads in the last month on npmjs.com. I could rename it, but that would make life a pain for some people. Lesson: be careful what you name things, it just might stick.

Also, please note that I have included a bunch of "devDependencies" and "peerDependencies." "peerDependencies" goes in and out of fashion, and I believe it may be deprecated soon or already. That said, it seems to work just fine and it lets npm know that these are dependencies that are probably shared with other packages. Just be aware that it may need to change in the near future. "devDependencies" are those dependencies that will only be used to build and test this library.

Now, take a look at the "scripts" section of our package.json. Npm will run any script in this section by calling `npm run <script>`. Npm also supports a rather large number of special scripts. For a complete reference, check out [npmjs on scripts](https://docs.npmjs.com/misc/scripts).

We list four scripts: build, test, test-cov, and prepublish. Three of these scripts -- build, test, and prepublish -- are special scripts. "prepublish", as its name implies is called before a package is made available. This makes "prepublish" a good place to run the build script.

The build script is straightforward enough.

    #!/bin/sh
    ./node_modules/.bin/babel ./src --out-dir dist --loose all --experimental

We are just running babel on the './src' directory and outputting everything to the './dist' directory. We tell babel.js to use [loose mode](https://babeljs.io/docs/usage/loose/) because none of the caveats apply to us. We also tell babel to use `experimental` mode, though that may be a bad idea since all we really want is ES6, and ES6 is no longer considered experimental. Still, the code works fine like this, so I'm disinclined to make any changes. *We will go into more detail on Babel soon.*

Next we have our `scripts/test` script.

    #!/bin/sh
    ./node_modules/karma/bin/karma start karma.conf.js --single-run --browsers Firefox
    ./node_modules/.bin/mocha --require ./babel.js --compilers jsx:babel/register ./src/__tests__/*.mocha.*

The test script is comprised of two different tests. I'm going to ask you to "trust me (TM)" for a few a while. We will start covering the Karma test in the next section, and continue for several parts. We will cover the mocha test in a separate section. The reason we have the Mocha test is solely to be certain that importing the component into a non-browser context (like JSDOM) will not kill the whole test engine.

The `scripts/test-cov` script is almost the same. It just calls istanbul cover. However, as I will explain later, test coverage is fairly useless when using karma-browserify.

    #!/bin/sh
    ./node_modules/.bin/istanbul cover ./node_modules/karma/bin/karma start karma.conf.js -- --single-run --browsers Firefox

Finally, we need to remember to make our scripts executable, or they will not run and we will be wondering why.

    chmod +x scripts/*

At this point, run `npm install` and we should have our node_modules waiting for us.

>Note: I highly recommend setting up some kind of linting. Previously, I recommended jshint/jsxhint, but eslint is a better option these days. I recommend following Dan's [Lint Liek it's 2015](https://medium.com/@dan_abramov/lint-like-it-s-2015-6987d44c5b48) article. Just be sure to also setup 'eslint-plugin-react' (its already in the package.json above). You can find a sample '.eslintrc' file in the repo for the [react-item-box-input](https://github.com/HurricaneJames/react-item-box-input/blob/master/.eslintrc).


## Setting Up Karma

To start with TDD, we need to have a test engine setup. After some experimentation, I determined that [Jest](http://facebook.github.io/jest/) is not up to the task of testing components that are reliant on layout properties such as `offsetWidth`. This is because [JSDOM](https://github.com/tmpvar/jsdom), while great for CLI testing, lacks a layout engine.

Another popular choice is [Mocha.js](http://mochajs.org/). I now use Mocha.js for most of my projects because it is faster and seems to work better in most cases (though I do miss automocking and the super-simple setup of Jest). However, like Jest, I was using it with JSDOM. After several hours of fiddling around, I settled on [Karma-Runner](http://karma-runner.github.io/0.12/index.html) with Mocha.js. 

In order to make this work we first need to add a bunch of packages to our project. Then, we need to configure Karma to use those package correctly. Once that is done, we can write some tests and see red.

### Test Packages

We will need to grab several dependencies to make Karma work. First, we want base "karma" package, currently on v0.12. We will also need to include plugin support for Mocha ("karma-mocha") and sinon ("karma-sinon"). "karma-source-map-support" is a huge help when trying to read the output. Without "karma-source-map-support" plugin the debug statements are meaningless files/line numbers. With "karma-source-map-support" we get useful files and line numbers most of the time, though sadly not always, especially in Firefox.

Karma also requies launchers. A launcher is a plugin that launches and manages a real browser. There are launchers for Chrome ("karma-chrome-launcher") and Firefox ("karma-firefox-launcher"). There is also a launcher for PhantomJS, however I found PhantomJS did not work well with these tests. Chrome and Firefox do, and they are the real targets anyway, so yeah...

We are also going to use "karma-browserify." However, "karma-browserify" is a double edged sword. It makes testing CommonJS modules possible, but it seems to mess up test coverage. Of the two, I'll take working tests over code metrics, though I have not given up on finding a way to make the code metrics work.

With these packages we can get karma up and running with basic Mocha syntax. For assertions, I'm using [expect.js](https://github.com/Automattic/expect.js). There are plenty of other assertion libraries out there. If you don't like expect.js, check out [chaijs](http://chaijs.com/). Chaijs has expect syntax and assert syntax. I have also heard really good things about Michael Jackson's [expect](https://github.com/mjackson/expect) library, and it appears to have a syntax similar to Jest.

For mocking/stubbing/timer management I use [Sinon.JS](http://sinonjs.org/). I have yet to find another library that works as well.

## Configuring Karma

Karma requires a conf file. Fortunately, the Karma devs have a great tool for this, `karma init karma.conf.js`. After answering a few questions, this program will output a working conf file. Note, if you installed karma locally, which you probably did if you installed it via the package.json file, you will need to run `./node_modules/karma/bin/karma init my.conf.js`. Below is what I entered to generate the starting karma.conf.js for this project.

    ~/Projects/react-item-box-input $ ./node_modules/karma/bin/karma init karma.conf.js

    Which testing framework do you want to use ?
    Press tab to list possible options. Enter to move to the next question.
    > mocha

    Do you want to use Require.js ?
    This will add Require.js plugin.
    Press tab to list possible options. Enter to move to the next question.
    > no

    Do you want to capture any browsers automatically ?
    Press tab to list possible options. Enter empty string to move to the next question.
    > Chrome
    > Firefox
    > 

    What is the location of your source and test files ?
    You can use glob patterns, eg. "js/*.js" or "test/**/*Spec.js".
    Enter empty string to move to the next question.
    > src/__tests__/*-test.js*
    > 

    Should any of the files included by the previous patterns be excluded ?
    You can use glob patterns, eg. "**/*.swp".
    Enter empty string to move to the next question.
    > 

    Do you want Karma to watch all the files and run the tests on change ?
    Press tab to list possible options.
    > yes

This generated a standard configuration file.

    module.exports = function(config) {
      config.set({
        basePath: '',
        frameworks: ['mocha'],
        files: [
          'src/__tests__/*-test.js*'
        ],
        exclude: [
        ],
        preprocessors: {
        },
        reporters: ['progress'],
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: true,
        browsers: ['Chrome', 'Firefox'],
        singleRun: false
      });
    };

There were several important choices that we made here. First, we choose `mocha` instead of `jasmine`. We also added both Chrome and Firefox browsers. You do not need both, but I like to run the tests in both just to be sure, and Travis-CI supports Firefox for continuous integration. Most importantly, we only set the `files` to `'src/__tests__/*-test.js*'` because we are going to rely on browserify to package everything up. Also, this will ignore anything that ends in mocha.js, which we will use for our pure Mocha tests.

>Sidenote: The Firefox launcher works relatively well, but has some problems. Source maps seem to fail more commonly with Firefox than Chrome. Also, as we will see in Part 3 of this series, Firefox has a weird bug where the debug console says a test passed, but the terminal says it failed. That one bug is the only failing test in the suite, and it only fails in Firefox.

Once we have a basic setup, we need to add some frameworks to karma so our tests will run.

    frameworks: ['mocha', 'browserify', 'sinon', 'source-map-support'],

We will also need to add a `preprocessor` to tell karma to browserify our tests. This is why we do not need to load our src files into the browser, browserify bundles them up and does it for us.

    preprocessors: {
      './src/__tests__/*-test.js*': 'browserify'
    },

"karma-browserify" uses a `browserify` config section in the karma config file.

    browserify: {
      transform: [ [ 'babelify', { optional: ['runtime'] } ] ],
      extensions: [ '.js', '.jsx' ],
      debug: true
    },

This tells browserify to use babel, via babelify, on our code. [Babel](https://babeljs.io/) is an amazing transpiler that converts JSX and ES6 to ES5 syntax which will run just about anywhere. We tell babelify to use the optional runtime to convert ES6 functions into ES5 functions. We also tell browserify to use debug mode so it generates sourcemaps. The "karma-soure-maps-support" plugin will use those sourcemaps when generating debug info that we need to figure out not just which test failed, but frequently where it failed.

With all of this setup, Karma will launch a browser for us, preprocess our test files and any src files they include with browserify/babel, and run through our tests using Mocha. All we have to do is run the `start` command.

    ./node_modules/karma/bin/karma start karma.conf.js --single-run --browsers Firefox

This tells karma to run a single time using Firefox. If you prefer Chrome, as I generally do when workingon the code/tests, replace Firefox with Chrome. You can run both at the same time by leaving off the `--browsers` option completely. If you would like Karma to sit in the background and keep running tests, remove `--single-run`.

>Tip: When debugging, it is often helpful to remove the `--single-run` option so that karma stays open and we can use the developer tools to inspect things. I generally create a "tdd" setting in the "scripts" section of the package.json file. Running `npm run tdd` will then run karma in watch mode and re-run scripts when files or tests change. Karma and/or Mocha are a bit unstable in this mode though, so you will probably have to restart it frequently.

## Conclusion

That is it for this part of the series. At this point you should have karma setup to run mocha based tests in the '`src/__tests__`' directory via npm test. The next article will walk through our initial requirements and building out most of them.
