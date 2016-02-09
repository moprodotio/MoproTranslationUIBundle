# MoproTranslationUIBundle

A [different UI](https://twitter.com/de_la_tech/status/696777702645309440) for the JMSTranslationBundle.

## Installation

- Install the bundle through composer

		composer require mopro/translation-ui-bundle

- Instanciate the bundle for the `dev` environment

	 	if ('dev' === $this->getEnvironment()) {
           $bundles[] = new Mopro\Bundle\TranslationUIBundle\MoproTranslationUIBundle();
    	}

- Import routing in your `app/config/routing_dev.yml` file

    	mopro_translation_ui:
           resource: "@MoproTranslationUIBundle/Controller/"
           type:     annotation

(The routing will conflict with the existing JMSTranslation UI, so remove the routes imports if needed)

## Usage

Go to `http://your.website/app_dev.php/_trans` and start translating.

## Development

This bundle relies on Javascript. It uses all the cool things we have in 2016
(see package.json file for a list of dependencies). If you want to develop,
make sure you have at least node and npm installed. Then, you will need to run these command:

    npm install -g webpack
    npm install

In order to generate the javascript file, you will need to run the `webpack` command.

## LICENSE

See LICENSE file.
