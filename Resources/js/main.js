import React from 'react';
import ReactDOM from 'react-dom';
import thunkMiddleware from 'redux-thunk';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux'

import TranslationUI from './TranslationUI.js';

var Immutable = require('immutable');

const defaultState = {
    indexURL: '',
    updateURL: '',

    loading: false,
    domains: Immutable.List(),
    locales: Immutable.List(),
    messages: Immutable.Map(),
    shownMessages: Immutable.Map(),

    updateMessage: updateMessage,

    filterDomain: '',
    filterNew: false,
    filterNotTranslated: false,

    funcFilterSearch: uiFilterSearch,
    funcFilterDomain: uiFilterDomain,
    toggleFilterNew: uiFilterNew,
    toggleFilterNotTranslated: uiFilterNotTranslated
};

const UI_FILTER_SEARCH = 'ui_filter_search';
function uiFilterSearch(search) {
    return {
        type:UI_FILTER_SEARCH,
        payload: search
    };
}

const UI_FILTER_DOMAIN = 'ui_filter_domain';
function uiFilterDomain(domain) {
    return {
        type:UI_FILTER_DOMAIN,
        payload: domain
    };
}

const UI_FILTER_NEW = 'ui_filter_new';
function uiFilterNew(filterNew) {
    return {
        type:UI_FILTER_NEW,
        payload: filterNew
    };
}

const UI_FILTER_NOT_TRANSLATED = 'ui_filter_not_translated';
function uiFilterNotTranslated(filterNotTranslated) {
    return {
        type:UI_FILTER_NOT_TRANSLATED,
        payload: filterNotTranslated
    };
}

const UI_MESSAGE_UPDATE = 'ui_message_update';
function uiMessageUpdate() {
    return {
        type: UI_UPDATE_MESSAGE,
        payload: {}
    };
}

const UI_MESSAGE_UPDATED = 'ui_message_updated';
function uiMessageUpdated() {
    return {
    };
}

const UI_REFRESH = 'ui_refresh';
function uiRefresh(indexURL, updateURL) {
    return function(dispatch) {
        dispatch({type: UI_REFRESH, payload: {indexURL: indexURL, updateURL: updateURL}});
        var request = {
            method: 'GET',
            credentials: 'same-origin',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
        }

        return fetch(indexURL, request)
               .then(response => response.json())
               .then(json => dispatch(uiRefreshing(json)));
    }
}

const UI_REFRESHING = 'ui_refreshing';
function uiRefreshing(json) {
    return function(dispatch) {
        dispatch({type: UI_REFRESHING, payload: json});
        uiRefreshed();
    }
}

const UI_REFRESHED = 'ui_refreshed';
function uiRefreshed() {
    return {
        type: UI_REFRESHED,
        payload: {}
    };
}

const UI_UPDATE_MESSAGE = 'ui_update_message';
function updateMessage(url, domain, key, locale, message) {
    return function(dispatch) {
        var request = {
            method: 'PUT',
            body: JSON.stringify({
                domain: domain,
                key: key,
                locale: locale,
                message: message
            })
        }

        return fetch(url, request)
            .then(function(response) {
                if (response.status >= 200 && response.status < 300) {
                    return response
                } else {
                    var error = new Error(response.statusText)
                        error.response = response
                        throw error
                }
            })
            .then(function(response) {
                dispatch({
                    type: UI_UPDATE_MESSAGE,
                    payload: {
                        domain: domain,
                        key: key,
                        locale: locale,
                        message: message,
                        succeed: true
                    }
                });
            })
            .catch(function(error) {
                dispatch({
                    type: UI_UPDATE_MESSAGE,
                    payload: {
                        domain: domain,
                        key: key,
                        locale: locale,
                        message: message,
                        succeed: false
                    }
                });
                window.alert(error);
            });
    }
}

function translationUIReducer(state = defaultState, action) {
    switch(action.type) {
        case UI_UPDATE_MESSAGE:
            var index = state.messages.findEntry(function(item) {
                return (item.get('domain') == action.payload.domain && item.get('key') == action.payload.key)
            })
            var succeed = {};
            succeed[action.payload.locale] = action.payload.succeed;
            var item = state.messages.get(index[0]).toJS();
            if ("succeed" in item) {
                item.succeed = Object.assign({}, item.succeed, succeed);
            } else {
                item.succeed = succeed;
            }
            item.locales[action.payload.locale] = action.payload.message;
            var messages = state.messages.set(index[0], Immutable.fromJS(item));

            return Object.assign({}, state, {messages: messages});
        case UI_REFRESH:
            return Object.assign({}, state, {indexURL: action.payload.indexURL, updateURL: action.payload.updateURL, loading: true});
        case UI_FILTER_SEARCH:
            return Object.assign({}, state, {filterSearch: action.payload});
        case UI_FILTER_DOMAIN:
            return Object.assign({}, state, {filterDomain: action.payload});
        case UI_FILTER_NEW:
            return Object.assign({}, state, {filterNew: action.payload, filterNotTranslated: false});
        case UI_FILTER_NOT_TRANSLATED:
            return Object.assign({}, state, {filterNew: false, filterNotTranslated: action.payload});
        case UI_REFRESHING:
            var payload = action.payload;
            return Object.assign({}, state, {
                loading: false,
                domains: Immutable.fromJS(payload.domains),
                locales: Immutable.fromJS(payload.locales),
                configs: Immutable.fromJS(payload.config),
                messages: Immutable.fromJS(payload.messages),
            });
        case UI_REFRESHED:
            return Object.assign({}, state, {loading: false});
        default:
            return state;
    };
}

// Redux/React stuff
const createStoreWithMiddleware = applyMiddleware(thunkMiddleware)(createStore);
const store = createStoreWithMiddleware(translationUIReducer);

let container = document.getElementById('mopro_translation_container');

var indexURL = container.getAttribute('data-index-url');
var updateURL = container.getAttribute('data-update-url');

ReactDOM.render(
    <Provider store={store}>
        <TranslationUI />
    </Provider>,
container);

store.dispatch(uiRefresh(indexURL, updateURL));
