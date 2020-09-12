import * as React from "react";
import { getDishes, DishRecord } from "../database/database";
import { getImage } from "../images/images";


export const App = (props: {}) => {
    const dish = selectRandom();
    const name = dish.name;
    return (
    <div id="app">
        <h1><a href="./">Jumpaku Dinner</a></h1>
        <h2>{name}</h2>
        <Images images={dish.images}/>
        <h2>材料</h2>
        <dl>
            <dt>必須</dt>
            <Ingredients ingredients={dish.ingredients.must}/>
            <dt>推奨</dt>
            <Ingredients ingredients={dish.ingredients.should}/>
            <dt>任意</dt>
            <Ingredients ingredients={dish.ingredients.may}/>
        </dl>
        <h2>ひとこと</h2>
        <Comment comment={dish.comment}/>
    </div>
    );
};

const Ingredients = (props: {ingredients: ReadonlyArray<string>}) => {
    const joined = props.ingredients.join("，");
    return <dd>{joined === "" ? "無し" : joined}</dd>
}

const Images = (props: {images: ReadonlyArray<string>}) => {
    return <div className="dishImages">{props.images.map((imageName, index) => <img src={getImage(imageName)} key={index} className="dishImage"/>)[0]}</div>;
}

const Comment = (props: {comment: string}) => {
    return <p>{props.comment === "" ? "無し" : props.comment}</p>;
}

function selectRandom(): Readonly<DishRecord> {
    const dishes = getDishes();
    const index =  Math.floor(Math.random() * Math.floor(dishes.length-1));
    return dishes[index];
}

