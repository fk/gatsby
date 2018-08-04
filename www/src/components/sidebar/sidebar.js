import React, { Component } from "react"

import Item from "./item"
import ExpandAllButton from "./button-expand-all"
import getActiveItem from "../../utils/sidebar/get-active-item"
import getActiveItemParents from "../../utils/sidebar/get-active-item-parents"
import presets, { colors } from "../../utils/presets"
import { scale, options } from "../../utils/typography"

const isItemActive = (activeItemParents, item) => {
  if (activeItemParents) {
    for (let parent of activeItemParents) {
      if (parent === item.title) return true
    }
  }

  return false
}

const getOpenItemHash = (itemList, state) => {
  for (let item of itemList) {
    state.openSectionHash[item.title] =
      isItemActive(state.activeItemParents, item) ||
      state.activeItemLink.title === item.title

    if (item.items) {
      getOpenItemHash(item.items, state)
    }
  }

  return false
}

class SidebarBody extends Component {
  constructor(props, context) {
    super(props, context)

    this._toggleSection = this._toggleSection.bind(this)
    this.state = { ...this._getInitialState(props) }
  }

  componentDidMount() {
    const key = this.props.itemList[0].key
    const initialState = this.state
    const localState = localStorage.getItem(`gatsbyjs:sidebar:${key}`)
    let newState

    const bar = Object.keys(initialState.openSectionHash).filter(function(key) {
      return initialState.openSectionHash[key]
    })

    if (localState) {
      newState = {
        ...initialState,
        openSectionHash: JSON.parse(localState).openSectionHash,
      }

      for (let item in initialState.openSectionHash) {
        for (let parent of bar) {
          if (parent === item) {
            newState.openSectionHash[item] = true
          }
        }
      }

      this.setState(newState)
    } else {
      this._writeLocalStorage(this.state, key)
    }
  }

  static getDerivedStateFromProps(props, state) {
    if (props.activeItemHash !== state.activeItemHash) {
      return {
        activeItemLink: getActiveItem(
          props.itemList,
          props.location,
          props.activeItemHash
        ),
        activeItemHash: props.activeItemHash,
      }
    }

    return null
  }

  _writeLocalStorage(state, key) {
    localStorage.setItem(`gatsbyjs:sidebar:${key}`, JSON.stringify(state))
  }

  _getInitialState(props) {
    const activeItemLink = getActiveItem(
      props.itemList,
      props.location,
      props.activeItemHash
    )

    const state = {
      openSectionHash: {},
      expandAll: false,
      key: props.itemList[0].key,
      activeItemHash: props.activeItemHash,
      activeItemLink: activeItemLink,
      activeItemParents: getActiveItemParents(
        props.itemList,
        activeItemLink,
        []
      ),
    }

    getOpenItemHash(props.itemList, state)

    return state
  }

  _toggleSection(item) {
    const { openSectionHash } = this.state

    const newState = {
      openSectionHash: {
        ...openSectionHash,
        [item.title]: !openSectionHash[item.title],
      },
    }

    this._writeLocalStorage(newState, this.state.key)
    this.setState(newState)
  }

  _expandAll = () => {
    if (this.state.expandAll) {
      this._writeLocalStorage(
        { openSectionHash: this._getInitialState(this.props).openSectionHash },
        this.state.key
      )
      this.setState({
        ...this._getInitialState(this.props),
        expandAll: false,
      })
    } else {
      let openSectionHash = { ...this.state.openSectionHash }
      Object.keys(openSectionHash).forEach(k => (openSectionHash[k] = true))
      this._writeLocalStorage({ openSectionHash }, this.state.key)
      this.setState({ openSectionHash, expandAll: true })
    }
  }

  render() {
    const { closeSidebar, itemList, location } = this.props
    const { openSectionHash, activeItemLink, activeItemParents } = this.state

    return (
      <div className="docSearch-sidebar" css={{ height: `100%` }}>
        <ExpandAllButton
          onClick={this._expandAll}
          expandAll={this.state.expandAll}
        />
        <ul css={{ ...styles.list }}>
          {itemList.map((item, index) => (
            <Item
              activeItemLink={activeItemLink}
              activeItemParents={activeItemParents}
              isActive={openSectionHash[item.title]}
              item={item}
              key={index}
              level={0}
              location={location}
              onLinkClick={closeSidebar}
              onSectionTitleClick={this._toggleSection}
              openSectionHash={openSectionHash}
            />
          ))}
        </ul>
      </div>
    )
  }
}

export default SidebarBody

const styles = {
  list: {
    margin: 0,
    paddingTop: 20,
    paddingBottom: 20,
    fontSize: scale(-1 / 10).fontSize,
    [presets.Phablet]: {
      fontSize: scale(-2 / 10).fontSize,
    },
    [presets.Tablet]: {
      backgroundColor: colors.ui.whisper,
      borderRight: `1px solid ${colors.ui.border}`,
      fontSize: scale(-4 / 10).fontSize,
    },
    "&&": {
      "& a": {
        fontFamily: options.systemFontFamily.join(`,`),
      },
    },
    "& li": {
      margin: 0,
      listStyle: `none`,
    },
    "& > li:last-child > span:before": {
      display: `none`,
    },
  },
}
