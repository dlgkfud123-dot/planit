"use client";
import Image from "next/image";
import Link from "next/link";
import {useEffect,useState} from "react";
import {places,type Place} from "../../data/places";
import {cityByName} from "../../data/cities";

export default function PlaceDetail(){
 const[place,setPlace]=useState<Place|null|undefined>(undefined);
 useEffect(()=>{const timer=window.setTimeout(()=>{const id=new URLSearchParams(location.search).get("id");setPlace(places.find(item=>item.id===id)||null)},0);return()=>window.clearTimeout(timer)},[]);
 if(place===undefined)return <main className="detailLoading">장소 정보를 불러오고 있어요…</main>;
 if(!place)return <main className="detailLoading"><h1>장소를 찾을 수 없습니다.</h1><Link href="/">EYRIA으로 돌아가기</Link></main>;
 const city=cityByName[place.cityId];
 return <main className="placeDetailPage"><header className="serviceHeader"><Link href="/" className="workspaceBrand">EYRIA <i>✦</i></Link><nav><Link href="/trips">내 여행</Link><button onClick={()=>history.back()}>이전 화면</button></nav></header><section className="placeVisual">{city&&<Image src={city.image} alt={`${place.cityId} 여행 풍경`} fill sizes="100vw" unoptimized/>}<div><span>{place.cityId} · {place.district}</span><h1>{place.name}</h1><p>{place.description}</p></div></section><section className="placeFacts"><article><small>위치</small><strong>{place.cityId} {place.district}</strong><p>좌표 {place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}</p></article><article><small>추천 체류시간</small><strong>약 {place.recommendedDuration}분</strong><p>{place.recommendedTime==="morning"?"오전":place.recommendedTime==="evening"?"저녁":place.recommendedTime==="afternoon"?"오후":"시간대 자유"} 방문 추천</p></article><article><small>운영시간 안내</small><strong>{place.openingHours}</strong><p>방문 전 최신 공식 안내를 확인해주세요.</p></article><article><small>예상 현지 지출</small><strong>{place.estimatedCost?`약 ${place.estimatedCost.toLocaleString()}원`:"무료 또는 현장 확인"}</strong><p>환율과 현지 상황에 따라 달라질 수 있습니다.</p></article></section><section className="placeInfoPanel"><div><h2>여행 포인트</h2><div className="placeTags">{place.tags.map(tag=><span key={tag}>#{tag}</span>)}</div><p>추천 이동 · {place.transportHints.join(" · ")}</p></div><div><h2>공식 정보</h2><p>현재 EYRIA 데이터에는 이 장소의 검증된 공식 사이트 URL과 도로명 주소가 등록되어 있지 않습니다. 잘못된 링크를 제공하지 않기 위해 임의 주소는 표시하지 않습니다.</p><a href={`https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`} target="_blank" rel="noreferrer">지도에서 위치 확인 ↗</a></div></section></main>
}
