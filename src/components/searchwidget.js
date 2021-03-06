import React, { useState, useRef } from "react"
import lunr, { Index } from "lunr"
import { graphql, useStaticQuery } from "gatsby"
import SearchResults from "./searchresults"
import iconClose from "../assets/icons-close.svg"
import iconSearch from "../assets/icons-search.svg"

const SEARCH_QUERY = graphql`
  query SearchIndexQuery {
    LunrIndex
  }
`
const SearchWidget = () => {
  const inputEl = useRef(null)
  const [value, setValue] = useState("")
  const [results, setResults] = useState([])
  const { LunrIndex } = useStaticQuery(SEARCH_QUERY)
  const index = Index.load(LunrIndex.index)
  const { store } = LunrIndex

  const handleChange = e => {
    const query = e.target.value || ""
    setValue(query)
    if (!query.length) {
      setResults([])
    }
    const keywords = query
      .trim()
      .replace(/\*/g, "")
      .toLowerCase()
      .split(/\s+/)

    if (keywords[keywords.length - 1].length < 2) {
      return
    }
    try {
      let andSearch = []
      keywords
        .filter(el => el.length > 1)
        .forEach((el, i) => {
          // per-single-keyword results
          const keywordSearch = index
            .query(function(q) {
              q.term(el, {
                editDistance: el.length > 5 ? 1 : 0,
              })
              q.term(el, {
                wildcard:
                  lunr.Query.wildcard.LEADING | lunr.Query.wildcard.TRAILING,
              })
            })
            .map(({ ref }) => {
              return {
                slug: ref,
                ...store[ref],
              }
            })
          andSearch =
            i > 0
              ? andSearch.filter(x =>
                  keywordSearch.some(el => el.slug === x.slug)
                )
              : keywordSearch
        })
      setResults(andSearch)
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <div className="search-wrapper">
      <div role="search">
        <img src={iconSearch} width="16" height="16" alt="" />
        <label htmlFor="search-input" className="visually-hidden">
          Search Tartans by Name
        </label>
        <input
          id="search-input"
          className={
            value.length ? "search-input" : "search-input mobile-minified"
          }
          ref={inputEl}
          type="search"
          value={value}
          onChange={handleChange}
          placeholder="Search Tartans by Name"
        />
        {value && (
          <button
            type="button"
            aria-label="Reset search"
            onClick={e => {
              handleChange(e)
              inputEl.current.focus()
            }}
          >
            <img src={iconClose} width="16" height="16" alt="" />
          </button>
        )}
      </div>
      {value.trim().length > 1 && <SearchResults results={results} />}
    </div>
  )
}
export default SearchWidget
