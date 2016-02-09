import React, {Component} from 'react';
import {connect} from 'react-redux';

class Filters extends Component {
    constructor(props) {
        super(props)

            this.filterNew = this.filterNew.bind(this);
            this.filterNotTranslated = this.filterNotTranslated.bind(this);
            this.filterDomain = this.filterDomain.bind(this);
            this.filterSearch = this.filterSearch.bind(this);
    }

    filterNew(e) {
        this.props.filterNew(e.target.checked);
    }
    filterNotTranslated(e) {
        this.props.filterNotTranslated(e.target.checked);
    }
    filterDomain(e) {
        this.props.filterDomain(e.target.value);
    }
    filterSearch(e) {
        this.props.filterSearch(e.target.value);
    }

    render() {
        var domains = [];
        domains.push(<option></option>);
        for (var option of this.props.domains) {
            domains.push(<option>{option}</option>);
        }

        return (
            <div className="panel panel-default">
                <div className="panel-heading"><h2 className="panel-title">Filters</h2></div>
                <div className="panel-body">
                <form className="form-inline">
                    <div className="form-group">
                        <label htmlFor="filter_domains" >Domain </label>
                        <select id="filter_domains" onChange={this.filterDomain} className="form-control">
                            {domains}
                        </select>
                    </div>
                    &nbsp;
                    <div className="form-group">
                        <label htmlFor="filter_search" >Search </label>
                        <input className="form-control" onKeyDown={this.filterSearch} />
                    </div>
                    <div className="form-group">
                        <div className="checkbox">
                            <label> <input type="checkbox" checked={this.props.filterNewChecked} onClick={this.filterNew} /> Show Only new </label>
                        </div>
                    </div>
                    <div className="form-group">
                        <div className="checkbox">
                            <label> <input type="checkbox" checked={this.props.filterNotTranslatedChecked} onClick={this.filterNotTranslated} /> Show only not translated </label>
                        </div>
                    </div>
                </form>
                </div>
            </div>
        )
    }
}

class MessagesTableRow extends Component {
    constructor(props) {
        super(props);

        this.onBlur = this.onBlur.bind(this);
    }

    onBlur(e) {
        var target = e.target;

        var original = target.getAttribute('data-original-value');
        if (target.value == original) {
            return;
        }

        var domain = target.getAttribute('data-domain');
        var key = target.getAttribute('data-key');
        var locale = target.getAttribute('data-locale');
        this.props.updateMessage(domain, key, locale, target.value)
        target.setAttribute('data-original-value', target.value);
    }

    render() {
        var rowClassName = '';
        if (this.props.isNew) {
            rowClassName = 'warning';
        }

        var locales = [];
        for (let trans of this.props.locales) {
            locales.push(<td><textarea onBlur={this.onBlur} rows="4" cols="48" data-original-value={trans[1]} data-domain={this.props.domain} data-key={this.props.messageKey} data-locale={trans[0]} onChange={this.onChange}>{trans[1]}</textarea></td>);
        }

        return (
                <tr className={rowClassName}>
                    <td>{this.props.domain}</td>
                    <td>{this.props.messageKey}</td>
                    {locales}
                </tr>
        )
    }
}

class MessagesTable extends Component {
    render() {
        var messages = [];
        for (let message of this.props.messages) {
            messages.push(<MessagesTableRow updateMessage={this.props.updateMessage} domain={message.get('domain')} isNew={message.get('isNew')} messageKey={message.get('key')} locales={message.get('locales')} />);
        }

        var locales = [];
        for (let locale of this.props.locales) {
            var key = 'th-'+locale
            locales.push(<th key={locale}>{locale}</th>);
        }

        return (
            <table className="table table-hover table-bordered table-condensed">
                <thead>
                    <tr>
                        <th>Domain</th>
                        <th>Key</th>
                        {locales}
                    </tr>
                </thead>
                <tbody>
                    {messages}
                </tbody>
            </table>
        )
    }
}

class TranslationUI extends Component {
    constructor(props) {
        super(props);

        this.filterNew = this.filterNew.bind(this);
        this.filterNotTranslated = this.filterNotTranslated.bind(this);
        this.filterDomain = this.filterDomain.bind(this);
        this.filterSearch = this.filterSearch.bind(this);
        this.updateMessage = this.updateMessage.bind(this);
    }

    filterNew(doFilter) {
        this.props.dispatch(this.props.toggleFilterNew(doFilter));
    }
    filterNotTranslated(doFilter) {
        this.props.dispatch(this.props.toggleFilterNotTranslated(doFilter));
    }
    filterSearch(search) {
        this.props.dispatch(this.props.funcFilterSearch(search));
    }
    filterDomain(domain) {
        this.props.dispatch(this.props.funcFilterDomain(domain));
    }

    updateMessage(domain, key, locale, value) {
        this.props.updateMessage(
            this.props.updateURL,
            domain,
            key,
            locale,
            value
        );
    }

    render() {
        return (
            <div>
                <Filters domains={this.props.domains}

                         filterNewChecked={this.props.filterNew}
                         filterNew={this.filterNew}

                         filterNotTranslatedChecked={this.props.filterNotTranslated}
                         filterNotTranslated={this.filterNotTranslated}

                         filterDomain={this.filterDomain}
                         filterSearch={this.filterSearch}
                    />
                <MessagesTable updateMessage={this.updateMessage} locales={this.props.locales} messages={this.props.shownMessages} />
            </div>
        );
    }
}

function mapStateToProp(state) {
    state.shownMessages = state.messages;
    if (state.filterDomain) {
        state.shownMessages = state.shownMessages.filter(function(message) {
            return message.get('domain') == state.filterDomain;
        });
    }

    if (state.filterSearch) {
        state.shownMessages = state.shownMessages.filter(function(message) {
            var re = new RegExp(state.filterSearch, "g");
            return re.test(message.get('key'));
        });
    }

    if (state.filterNew) {
        state.shownMessages = state.shownMessages.filter(function(message) {
            return message.get('isNew');
        });
    } else if (state.filterNotTranslated) {
        state.shownMessages = state.shownMessages.filter(function(message) {
            return message.get('notTranslated');
        });
    }

    return state;
}

export default connect(mapStateToProp)(TranslationUI);
