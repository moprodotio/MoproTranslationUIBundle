<?php

namespace Mopro\Bundle\TranslationUIBundle\Controller;

use Sensio\Bundle\FrameworkExtraBundle\Configuration\Method;
use Sensio\Bundle\FrameworkExtraBundle\Configuration\Route;
use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use JMS\TranslationBundle\Util\FileUtils;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

/**
 * @Route("/_trans")
 */
class UIController extends Controller
{
    /**
     * @Route("")
     * @Route("/", name="_mopro_translation_ui_index")
     */
    public function indexAction(Request $request)
    {
        return $this->render('MoproTranslationUIBundle:ui:index.html.twig' );
    }

    /**
     * @Route("/messages.json", name="_mopro_translation_ui_messages")
     */
    public function messagesAction(Request $request)
    {
        $sourceLanguage = $this->container->getParameter('jms_translation.source_language');

        $configFactory = $this->get('jms_translation.config_factory');

        $configs = $configFactory->getNames();
        $config = $request->query->get('config') ?: reset($configs);
        if (!$config) {
            throw new \RuntimeException('You need to configure at least one config under "jms_translation.configs".');
        }

        $translationsDir = $configFactory->getConfig($config, 'en')->getTranslationsDir();
        $files = FileUtils::findTranslationFiles($translationsDir);
        if (empty($files)) {
            throw new RuntimeException('There are no translation files for this config, please run the translation:extract command first.');
        }

        $domains = array_keys($files);
        $locales = array_keys($files[$domains[0]]);

        $all= [];
        $newMessages = [];

        $loader = $this->get('jms_translation.loader_manager');

        foreach ($domains as $domain) {
            foreach ($locales as $locale) {
                $catalogue = $loader->loadFile($files[$domain][$locale][1]->getPathName(), $files[$domain][$locale][0], $locale, $domain);
                foreach ($catalogue->getDomain($domain)->all() as $id => $message) {
                    if (!isset($all[$domain][$id])) {
                        $all[$domain][$id] = ['key' => $id, 'notTranslated' => false, 'isNew' => $message->isNew(), 'locales' => [], 'sources' => []];
                    }
                    $all[$domain][$id]['isNew'] = $all[$domain][$id]['isNew'] ?: $message->isNew();
                    $sources = $message->getSources();
                    foreach ($sources as $source) {
                        $all[$domain][$id]['sources'][] = (string) $source;
                        array_unique($all[$domain][$id]['sources']);
                    }

                    $all[$domain][$id]['locales'][$locale] = $message->getLocaleString();
                    if ($id === $message->getLocaleString()) {
                        $all[$domain][$id]['notTranslated'] = true;
                    }
                }
            }
        }

        $flat = [];
        foreach ($all as $domain => $messages) {
            foreach ($messages as $message) {
                $flat[] = array_merge(['domain' => $domain], $message);
            }
        }

        return new JsonResponse(array(
            'configs' => $configs,
            'config' => $configs[0],
            'domains' => $domains,
            'locales' => $locales,
            'messages' => $flat,
            'sourceLanguage' => $sourceLanguage,
        ));
    }

    /**
     * @Route("/messages", name="_mopro_translation_ui_messages_update", options = {"i18n" = false})
     * @Method("PUT")
     */
    public function updateAction(Request $request)
    {
        $data = json_decode($request->getContent(), true);

        $domain = $data['domain'];
        $locale = $data['locale'];
        $id = $data['key'];
        $message = $data['message'];

        $configFactory = $this->get('jms_translation.config_factory');
        $configs = $configFactory->getNames();
        $config = $request->query->get('config') ?: reset($configs);
        if (!$config) {
            throw new \RuntimeException('You need to configure at least one config under "jms_translation.configs".');
        }

        $config = $configFactory->getConfig($config, $locale);

        $files = FileUtils::findTranslationFiles($config->getTranslationsDir());
        if (!isset($files[$domain][$locale])) {
            throw new RuntimeException(sprintf('There is no translation file for domain "%s" and locale "%s".', $domain, $locale));
        }

        // TODO: This needs more refactoring, the only sane way I see right now is to replace
        //       the loaders of the translation component as these currently simply discard
        //       the extra information that is contained in these files

        list($format, $file) = $files[$domain][$locale];

        $updater = $this->get('jms_translation.updater');
        $updater->updateTranslation($file, $format, $domain, $locale, $id, $message);

        return new Response();
    }
}
